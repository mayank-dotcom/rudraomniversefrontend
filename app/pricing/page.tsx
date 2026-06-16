"use client"

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer";
import { ThemeProvider } from "@/lib/theme-context";
import { Zap, Code, Image as ImageIcon, GraduationCap, Building2, Loader2, ArrowRight, Volume2, Mic, Sparkles, X, Coins, Scan, Puzzle } from "lucide-react";
import { getPlansList, Plan, getPlanStrikeOff, getPublicSiteSettings, createPaymentOrder, verifyPayment, getWalletProfile } from "@/lib/chat-api";
import { getApiKey, getUserRole } from "@/lib/auth";
import { toast } from "sonner";


declare global {
  interface Window {
    Razorpay: any
  }
}

const PricingContent = () => {
    const isDarkMode = true;
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

    const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
    const [useCoins, setUseCoins] = useState(false);

    const [userRole] = useState<string | null>(() => getUserRole());

    const cannotUpgrade = !!userRole;

    useEffect(() => {
        const apiKey = getApiKey();
        if (apiKey) {
            getWalletProfile()
                .then(data => setWalletBalance(data.wallet_balance))
                .catch(() => {});
        }
    }, []);

    const handleRazorpayPayment = useCallback(async (plan: Plan, coinsToUse: number = 0) => {
        setProcessingPlanId(String(plan.id));
        try {
            const order = await createPaymentOrder(plan.id, coinsToUse > 0 ? coinsToUse : undefined, billingPeriod);
            const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || order.key_id;
            if (!razorpayKeyId) {
                toast.error("Payment gateway is not configured. Please contact support.");
                return;
            }

            if (!window.Razorpay) {
                await new Promise<void>((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                    script.onload = () => resolve();
                    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
                    document.body.appendChild(script);
                });
            }

            const options = {
                key: razorpayKeyId,
                amount: order.amount,
                currency: order.currency,
                name: 'Rudranex AI',
                description: (plan as any).plan_name || 'Subscription',
                order_id: order.order_id,
                handler: async function (response: any) {
                    try {
                        const result = await verifyPayment({
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        if (result.success) {
                            toast.success(`Plan upgraded to ${result.plan}!`);
                            setWalletBalance(prev => prev !== null ? prev - coinsToUse : prev);
                            setCheckoutPlan(null);
                        }
                    } catch (err: any) {
                        toast.error(err.message || "Payment verification failed");
                    }
                },
                modal: {
                    ondismiss: function () {
                        toast.info("Checkout cancelled");
                    }
                },
                theme: { color: '#00DDDD' }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (resp: any) {
                toast.error(resp.error?.description || "Payment failed");
            });
            rzp.open();
        } catch (err: any) {
            toast.error(err.message || "Failed to initiate payment");
        } finally {
            setProcessingPlanId(null);
        }
    }, [billingPeriod]);

    const handleSelectPlan = useCallback((plan: Plan) => {
        const role = getUserRole();
        if (role) {
            toast.error("Your subscription is managed by your organization. Contact your admin for changes.");
            return;
        }
        const isAgency = plan.plan_name?.toLowerCase().includes('agenc') || 
                         plan.plan_name?.toLowerCase().includes('heavy duty') || 
                         plan.plan_name?.toLowerCase().includes('enterprise');
        if (isAgency) {
            window.location.href = "/b2b";
            return;
        }

        const apiKey = getApiKey();
        if (!apiKey) {
            toast.error("Please log in first to subscribe to a plan.");
            return;
        }
        setCheckoutPlan(plan);
        setUseCoins(false);
    }, []);

    const [pageData, setPageData] = useState<{
        title: string;
        description: string;
        linkText?: string;
        linkUrl?: string;
        plans?: any[];
    }>({
        title: "Quiet power.\nTailored access.",
        description: "",
        linkText: "Learn More",
        linkUrl: "/pricing",
        plans: []
    });

    useEffect(() => {
        getPublicSiteSettings().then(res => {
            const setting = res.settings?.find(s => s.key === "pricing_page") || res.settings?.find(s => s.key === "b2b_page");
            if (setting?.value) {
                try {
                    const parsed = JSON.parse(setting.value);
                    setPageData({
                        title: parsed.title || "Quiet power.\nTailored access.",
                        description: parsed.description || "",
                        linkText: parsed.linkText || "Learn More",
                        linkUrl: parsed.linkUrl || "/pricing",
                        plans: parsed.plans || []
                    });
                } catch (e) {
                    console.error("Error parsing settings", e);
                }
            }
        }).catch(() => {});
    }, []);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const data = await getPlansList();
                if (data.success && data.plans) {
                    const mappedPlans = data.plans.map((plan: any) => ({
                        ...plan,
                        name: plan.plan_name || 'Unnamed Plan',
                        price: plan.price_inr || 0,
                        tokens: plan.monthly_tokens || 0,
                        images: plan.monthly_image_limit || 0,
                        personas: plan.feature_extraction_limit || 0,
                        daily_image_limit: plan.daily_image_limit || 0,
                        daily_vision_limit: plan.daily_vision_limit || 0,
                        monthly_flux_limit: plan.monthly_flux_limit || 0,
                        daily_tts_limit: plan.daily_tts_limit || 0,
                        daily_stt_limit: plan.daily_stt_limit || 0,
                        feature_extraction_limit: plan.feature_extraction_limit || 0,
                        monthly_tokens: plan.monthly_tokens || 0,
                        ocr_limit: plan.ocr_limit || 0
                    }));
                    setPlans(mappedPlans);
                }
            } catch (err) {
                console.error("Failed to fetch plans:", err);
                toast.error("Failed to load plans. Please refresh the page.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const getPlanIcon = (planName: string) => {
        if (planName.toLowerCase().includes('student')) return GraduationCap;
        if (planName.toLowerCase().includes('developer')) return Code;
        if (planName.toLowerCase().includes('agenc')) return Building2;
        return Zap;
    };

    const getPlanTag = (planName: string) => {
        if (planName.toLowerCase().includes('basic')) return 'BASIC';
        if (planName.toLowerCase().includes('pro student')) return 'BEST VALUE';
        if (planName.toLowerCase().includes('developer')) return 'MOST POPULAR';
        if (planName.toLowerCase().includes('acceleration')) return 'HIGH PERFORMANCE';
        if (planName.toLowerCase().includes('agenc')) return 'ENTERPRISE';
        return 'STANDARD';
    };

    const getMultiplierData = (planName: string) => {
        const list = [
            { keywords: ['free'], multiplier: '0.02x', tokens: '1K', features: [
                { icon: Zap, text: 'Engage in basic conversations with our AI assistant to outline ideas and answer everyday questions.' },
                { icon: ImageIcon, text: 'Create standard-definition custom graphics using basic image generation tools in the lab.' },
                { icon: Scan, text: 'Convert physical documents and paper images into digital text files using standard character recognition.' },
                { icon: Puzzle, text: 'Upload document files to extract high-level summaries and locate specific data points.' },
                { icon: Volume2, text: 'Convert written text articles into audio files to listen to study notes on the go.' },
                { icon: Mic, text: 'Dictate notes and letters using smart voice typing for transcription of spoken words.' }
            ] },
            { keywords: ['motion'], multiplier: '1x', tokens: '50K', features: [
                { icon: Zap, text: 'Engage in clear conversations with our AI assistant to draft outlines, brainstorm ideas, and answer simple questions.' },
                { icon: ImageIcon, text: 'Create standard-definition custom graphics and design unique illustrations using basic image generation tools in the lab.' },
                { icon: Scan, text: 'Convert physical documents and clear paper images into editable digital text files using standard character recognition.' },
                { icon: Puzzle, text: 'Upload single document files to extract high-level summaries and locate specific data points automatically.' },
                { icon: Volume2, text: 'Convert written text articles into clear audio recordings for listening to study notes on the go.' },
                { icon: Mic, text: 'Dictate notes and letters using smart voice typing for fast transcription of your daily spoken words.' },
            ]},
            { keywords: ['speed'], multiplier: '10x', tokens: '500K', features: [
                { icon: Zap, text: 'Unlock faster processing speeds and longer chat history windows for complex research tasks and documentation projects.' },
                { icon: ImageIcon, text: 'Produce high-definition digital illustrations instantly without waiting in standard queues during peak generation hours.' },
                { icon: Scan, text: 'Extract text from multi-page scanned PDF documents and low-resolution digital screenshots with enhanced OCR accuracy.' },
                { icon: Puzzle, text: 'Analyze large datasets to identify hidden trends and cross-reference information across your uploaded materials.' },
                { icon: Volume2, text: 'Listen to complete books and research reports narrated by natural, high-fidelity synthetic voices for long listening sessions.' },
                { icon: Mic, text: 'Convert long lectures and meetings into highly accurate text using advanced acoustic speech-to-text algorithms.' },
            ]},
            { keywords: ['velocity'], multiplier: '16x', tokens: '800K', features: [
                { icon: Zap, text: 'Deploy professional-grade reasoning engines optimized for executing multi-step logical operations and detailed code generation.' },
                { icon: ImageIcon, text: 'Generate ultra-realistic visual art and complex design mockups using advanced control parameters and model tuning.' },
                { icon: Scan, text: 'Scan complex business documents and extract layout details to export data into clean, structured tables.' },
                { icon: Puzzle, text: 'Synthesize information from multiple distinct file sources to generate comprehensive, cohesive executive summaries for your team.' },
                { icon: Volume2, text: 'Generate custom voiceovers with realistic emotional tones suitable for producing podcasts, video narration, and media.' },
                { icon: Mic, text: 'Transcribe live audio streams with automatic speaker identification and smart punctuation in multiple languages.' },
            ]},
            { keywords: ['acceleration'], multiplier: '20x', tokens: '1M', features: [
                { icon: Zap, text: 'Empower your production workflows with massive monthly token allocations for continuous, uninterrupted AI assistant interactions.' },
                { icon: ImageIcon, text: 'Create unlimited high-resolution commercial marketing graphics instantly using our fastest, state-of-the-art neural diffusion models.' },
                { icon: Scan, text: 'Automatically parse unstructured handwritten notes and complex archives using our custom layout intelligence engine.' },
                { icon: Puzzle, text: 'Identify semantic relationships and extract metadata schemas from your organization\'s entire document library in seconds.' },
                { icon: Volume2, text: 'Integrate low-latency voice synthesis into your customer-facing applications using premium, studio-quality speech generation APIs.' },
                { icon: Mic, text: 'Process noisy ambient audio files and complex board meetings using advanced neural speech recognition pipelines.' },
            ]},
            { keywords: ['agenc', 'heavy duty', 'enterprise'], multiplier: '100x', tokens: '5M', features: [
                { icon: Zap, text: 'Execute high-priority API queries on dedicated compute clusters for maximum uptime and zero throttling.' },
                { icon: ImageIcon, text: 'Train bespoke image generation models specifically designed to replicate and match your unique corporate brand guidelines.' },
                { icon: Scan, text: 'Process high-volume batches of document scans using parallelized OCR engines optimized for enterprise scaling.' },
                { icon: Puzzle, text: 'Deploy automated parsers to convert unstructured legacy business databases into clean, schema-compliant JSON structures.' },
                { icon: Volume2, text: 'Build real-time conversational voice agents featuring custom voice clones and sub-millisecond audio synthesis times.' },
                { icon: Mic, text: 'Transcribe massive archives of multilingual recordings simultaneously using our distributed acoustic neural network architecture.' },
            ]},
        ];
        const lower = planName.toLowerCase();
        return list.find(d => d.keywords.some(k => lower.includes(k))) || null;
    };

    const iconMap: Record<string, any> = {
        zap: Zap,
        image: ImageIcon,
        scan: Scan,
        puzzle: Puzzle,
        volume: Volume2,
        mic: Mic
    };

    const getPlanFeaturesList = (planName: string) => {
        if (pageData.plans && pageData.plans.length > 0) {
            const matchedPlan = pageData.plans.find(p => p.planName?.toLowerCase() === planName.toLowerCase());
            if (matchedPlan && Array.isArray(matchedPlan.features) && matchedPlan.features.length > 0) {
                return matchedPlan.features.map((f: any) => ({
                    icon: iconMap[f.icon] || Zap,
                    text: f.text
                }));
            }
        }
        const md = getMultiplierData(planName);
        return md ? md.features : [];
    };

    const getCardStyles = (index: number, isSpeed: boolean, isAgency: boolean) => {
        if (isDarkMode) {
            if (isSpeed) return 'premium-card-speed-dark';
            if (isAgency) return 'premium-card-agency-dark';
            return 'premium-card-dark';
        } else {
            if (isSpeed) return 'premium-card-speed-light';
            if (isAgency) return 'premium-card-agency-light';
            return 'premium-card-light';
        }
    };

    if (isLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#050308]" : "bg-[#fdfdfd]"}`}>
                <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#050308] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white`}>
            <Navbar visible={true} />

            <section className="relative pt-48 pb-20 px-6 md:px-12 bg-mesh">
                <div className="container mx-auto">
                    <div className="flex flex-col lg:flex-row gap-20 mb-32">
                        <div className="lg:w-1/4">
                            {/* Technical Label */}
                            <span 
                                className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/30"} block mb-8`}
                                style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                            >
                                § 04 — ACCESS
                            </span>
                            <h2 
                                className={`font-sans font-bold uppercase leading-relaxed ${isDarkMode ? "text-white/30" : "text-black/40"}`}
                                style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                            >
                                Subscription <br /> & Plans
                            </h2>
                        </div>
                        <div className="lg:w-3/4">
                            {/* Hero Headline — 72px Bold, -0.04em */}
                            <h1 
                                className="font-display font-bold leading-[0.9] mb-12"
                                style={{ fontSize: "clamp(3.5rem, 9vw, 72px)", letterSpacing: "-0.04em" }}
                            >
                                {pageData.title.split('\n').map((line, idx, arr) => (
                                    <span key={idx}>
                                        {idx > 0 && <br />}
                                        {idx === arr.length - 1 ? (
                                            <span className="font-serif italic font-normal text-black dark:text-white">{line}</span>
                                        ) : (
                                            line
                                        )}
                                    </span>
                                ))}
                            </h1>
                            {/* Body Copy — 16px Regular */}
                            {pageData.description && (
                                <p 
                                    className={`max-w-xl leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}
                                    style={{ fontSize: "16px" }}
                                >
                                    {pageData.description}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Billing Switcher Tabset */}
                    <div className="flex justify-center items-center mb-16">
                        <div className={`relative flex p-1.5 rounded-full border ${isDarkMode ? "bg-[#111] border-white/10" : "bg-[#f0f0f0] border-black/10"}`}>
                            <button
                                onClick={() => setBillingPeriod('monthly')}
                                className={`relative z-10 px-8 py-3 text-xs font-sans font-bold uppercase tracking-widest rounded-full transition-all duration-300 overflow-hidden ${
                                    billingPeriod === 'monthly'
                                        ? "upgrade-btn !w-auto !font-sans text-black shadow-[0_0_20px_rgba(200,200,200,0.5)]"
                                        : (isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black")
                                }`}
                            >
                                {billingPeriod === 'monthly' && (
                                    <>
                                        <div className="bubble-layer silver-bubble-1"></div>
                                        <div className="bubble-layer silver-bubble-2"></div>
                                        <div className="bubble-layer silver-bubble-3"></div>
                                        <div className="bubble-layer silver-bubble-4"></div>
                                        <div className="bubble-layer silver-bubble-5"></div>
                                        <div className="bubble-layer silver-bubble-6"></div>
                                        <div className="bubble-layer silver-bubble-7"></div>
                                    </>
                                )}
                                <span className="relative z-10">Monthly</span>
                            </button>
                            <button
                                onClick={() => setBillingPeriod('yearly')}
                                className={`relative z-10 px-8 py-3 text-xs font-sans font-bold uppercase tracking-widest rounded-full transition-all duration-300 overflow-hidden ${
                                    billingPeriod === 'yearly'
                                        ? "upgrade-btn !w-auto !font-sans text-black shadow-[0_0_20px_rgba(200,200,200,0.5)]"
                                        : (isDarkMode ? "text-white/60 hover:text-white" : "text-black/60 hover:text-black")
                                }`}
                            >
                                {billingPeriod === 'yearly' && (
                                    <>
                                        <div className="bubble-layer silver-bubble-1"></div>
                                        <div className="bubble-layer silver-bubble-2"></div>
                                        <div className="bubble-layer silver-bubble-3"></div>
                                        <div className="bubble-layer silver-bubble-4"></div>
                                        <div className="bubble-layer silver-bubble-5"></div>
                                        <div className="bubble-layer silver-bubble-6"></div>
                                        <div className="bubble-layer silver-bubble-7"></div>
                                    </>
                                )}
                                <span className="relative z-10">
                                    Yearly <span className={`normal-case text-[9px] font-bold ml-1 px-1.5 py-0.5 rounded-full ${billingPeriod === 'yearly' ? "bg-black/15 text-black/80" : "bg-[var(--brand-accent)]/20 text-[var(--brand-accent)]"}`}>Save 30%</span>
                                </span>
                            </button>
                        </div>
                    </div>

                    {cannotUpgrade && (
                        <div className="mb-10 p-5 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-center">
                            <p className="text-sm font-semibold text-yellow-400/90">
                                Your subscription is managed by your organization.
                            </p>
                            <p className="text-xs text-yellow-400/60 mt-1">
                                Contact your admin to change your plan.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan, i) => {
                            const Icon = getPlanIcon(plan.plan_name || '');
                            const tag = getPlanTag(plan.plan_name || '');
                            const isSpeed = plan.plan_name?.toLowerCase().includes('speed') || plan.plan_name?.toLowerCase().includes('developer') || plan.plan_name?.toLowerCase().includes('pro') || plan.plan_name?.toLowerCase().includes('acceleration');
                            const isAgency = plan.plan_name?.toLowerCase().includes('agenc') || plan.plan_name?.toLowerCase().includes('heavy duty') || plan.plan_name?.toLowerCase().includes('enterprise');

                            return (
                                <motion.div
                                    key={plan.id || i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                    className={`relative p-6 sm:p-10 flex flex-col group transition-all duration-500 backdrop-blur-sm premium-card-wrapper ${getCardStyles(i, isSpeed, isAgency)}`}
                                >
                                    {/* Metallic background reflection and sweep shine */}
                                    <div className="metallic-gradient-overlay" />
                                    <div className="card-shine" />

                                    {/* Plan Tag — Cyan Blue Badge style */}
                                    <div className="flex justify-between items-center mb-16 relative z-10">
                                        <span 
                                            className={`font-sans font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full text-[10px] ${
                                                isDarkMode 
                                                    ? "text-[var(--color-cyan)] bg-[var(--color-cyan)]/10 border border-[var(--color-cyan)]/30" 
                                                    : "text-[#008080] bg-[#008080]/5 border border-[#008080]/20"
                                            }`}
                                        >
                                            {tag}
                                        </span>
                                        {(isSpeed || isAgency) && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />}
                                    </div>

                                    {/* Plan Title & Price */}
                                    <div className="mb-12 relative z-10">
                                        <h3 
                                            className="font-display font-semibold uppercase mb-4 tracking-tight"
                                            style={{ fontSize: "20px" }}
                                        >
                                            {plan.plan_name}
                                        </h3>
                                        {(() => {
                                            const isAgency = plan.plan_name?.toLowerCase().includes('agenc') || plan.plan_name?.toLowerCase().includes('heavy duty') || plan.plan_name?.toLowerCase().includes('enterprise');
                                            if (isAgency) {
                                                return (
                                                    <div className="flex items-center justify-center w-full my-2 h-[80px]">
                                                        <span className="font-display font-bold leading-none text-[var(--color-cyan)] select-none" style={{ fontSize: "110px" }}>
                                                            ∞
                                                        </span>
                                                    </div>
                                                );
                                            }
                                            const isYearly = billingPeriod === 'yearly';
                                            const basePrice = plan.price_inr || plan.price || 0;
                                            const displayPrice = isYearly ? Math.round(basePrice * 0.7) : basePrice;

                                            return (
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-baseline gap-2">
                                                         {(() => {
                                                              if (basePrice === 0) {
                                                                  return (
                                                                      <span className="font-display font-bold leading-none tracking-tighter text-[var(--color-cyan)]" style={{ fontSize: "40px" }}>
                                                                          ₹0
                                                                      </span>
                                                                  );
                                                              }
                                                              const strikeOffVal = (plan.strike_off_price && plan.strike_off_price > 0) ? plan.strike_off_price : getPlanStrikeOff(String(plan.id))?.price_inr;
                                                              if (isYearly) {
                                                                  const monthlyPrice = strikeOffVal ? strikeOffVal : basePrice;
                                                                  return (
                                                                      <>
                                                                          <span className="font-display font-bold leading-none tracking-tighter text-[var(--color-cyan)]" style={{ fontSize: "40px" }}>
                                                                              ₹{displayPrice}
                                                                          </span>
                                                                          <span className="font-display font-bold leading-none tracking-tighter line-through opacity-40" style={{ fontSize: "24px" }}>
                                                                              ₹{monthlyPrice}
                                                                          </span>
                                                                      </>
                                                                  )
                                                              }
                                                              if (strikeOffVal) {
                                                                  return (
                                                                      <>
                                                                          <span className="font-display font-bold leading-none tracking-tighter text-[var(--color-cyan)]" style={{ fontSize: "40px" }}>
                                                                              ₹{basePrice}
                                                                          </span>
                                                                          <span className="font-display font-bold leading-none tracking-tighter line-through opacity-40" style={{ fontSize: "24px" }}>
                                                                              ₹{strikeOffVal}
                                                                          </span>
                                                                      </>
                                                                  )
                                                              }
                                                              return (
                                                                  <span className="font-display font-bold leading-none tracking-tighter" style={{ fontSize: "40px" }}>
                                                                      ₹{displayPrice}
                                                                  </span>
                                                              )
                                                          })()}
                                                        <span className={`font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-black/30"}`} style={{ fontSize: "10px" }}>/mo</span>
                                                    </div>
                                                    {isYearly && basePrice > 0 && (
                                                        <span className={`text-[10px] font-sans font-bold tracking-wider uppercase ${isDarkMode ? "text-white/40 opacity-50" : "text-black opacity-95"}`}>
                                                            Billed annually (₹{(displayPrice * 12).toLocaleString()})
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    {/* Features */}
                                    <div className="flex-1 space-y-5 mb-16 relative z-10">
                                        {(() => {
                                            const features = getPlanFeaturesList(plan.plan_name || '');
                                            return features.length > 0 ? (
                                                <>
                                                    {features.map((f: any, idx: number) => (
                                                        <div key={idx} className="flex items-start gap-4">
                                                            <f.icon className="h-5 w-5 shrink-0 text-[var(--color-cyan)] mt-0.5" />
                                                            <p className={`text-[15px] font-medium leading-relaxed ${isDarkMode ? "text-white/70" : "text-black/70"}`}>
                                                                {f.text}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </>
                                            ) : null;
                                        })()}
                                    </div>

                                    {/* Button — 14px Semi-Bold */}
                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={cannotUpgrade || processingPlanId === String(plan.id) || plan.price_inr === 0}
                                        className={`w-full py-4 font-sans font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed relative z-10 ${
                                            plan.price_inr === 0
                                                ? (isDarkMode ? "border border-white/10 text-white" : "border border-black/10 text-black")
                                                : (isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90")
                                        }`}
                                        style={{ fontSize: "11px", letterSpacing: "0.2em" }}
                                    >
                                        {processingPlanId === String(plan.id)
                                            ? "Processing..."
                                            : cannotUpgrade
                                                ? "Locked"
                                                : plan.price_inr === 0
                                                    ? "Current Plan"
                                                    : "Select Plan"}
                                    </button>
                                </motion.div>
                            )
                        })}
                    </div>
                    
                    <div className="mt-32 text-center">
                        <p 
                            className={`font-sans font-bold uppercase ${isDarkMode ? "text-white/20" : "text-black/20"}`}
                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                        >
                            All plans include core AI access, privacy-first processing, and 24/7 priority support.
                        </p>
                    </div>
                </div>
            </section>

            {/* Checkout Modal */}
            {checkoutPlan && (() => {
                const isYearly = billingPeriod === 'yearly';
                const basePrice = Number(checkoutPlan.price_inr || checkoutPlan.price);
                const planPrice = isYearly ? basePrice * 0.7 * 12 : basePrice;
                const maxCoins = walletBalance !== null ? Math.min(walletBalance, planPrice - 1) : 0;
                const coinsToUse = useCoins ? Math.min(maxCoins, walletBalance || 0) : 0;
                const discountedPrice = planPrice - coinsToUse;
                const savings = coinsToUse;

                return (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCheckoutPlan(null)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`relative w-full max-w-md ${isDarkMode ? "bg-[#0c0914] border-white/10" : "bg-[#fcfcfc] border-black/10"} border p-8`}
                    >
                        <button
                            onClick={() => setCheckoutPlan(null)}
                            className={`absolute top-4 right-4 ${isDarkMode ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black"}`}
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <span className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/30" : "text-black/30"} block mb-1`}>
                            Checkout
                        </span>
                        <h3 className="font-display font-bold text-xl uppercase mb-2">
                            {checkoutPlan.plan_name} {isYearly && <span className="text-[10px] tracking-widest uppercase font-bold text-[var(--color-cyan)] bg-[var(--color-cyan)]/10 px-2 py-1 rounded-full ml-2">Yearly</span>}
                        </h3>

                        {/* Price Display */}
                        <div className="flex flex-col gap-1.5 mb-6">
                            <div className="flex items-baseline gap-2">
                                {useCoins && savings > 0 ? (
                                    <>
                                        <span className="font-display font-bold tracking-tight line-through opacity-40" style={{ fontSize: "32px" }}>
                                            ₹{planPrice.toLocaleString()}
                                        </span>
                                        <span className="font-display font-bold tracking-tight text-[var(--color-cyan)]" style={{ fontSize: "32px" }}>
                                            ₹{discountedPrice.toLocaleString()}
                                        </span>
                                    </>
                                ) : (
                                    <span className="font-display font-bold tracking-tight" style={{ fontSize: "32px" }}>
                                        ₹{planPrice.toLocaleString()}
                                    </span>
                                )}
                                <span className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                    {isYearly ? "/yr" : "/mo"}
                                </span>
                            </div>
                            {isYearly && (
                                <p className={`text-[11px] font-semibold tracking-wide ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                    You are subscribing to the annual plan. One-time payment of ₹{planPrice.toLocaleString()} billed yearly.
                                </p>
                            )}
                        </div>

                        {/* Wallet & Coin Discount */}
                        {walletBalance !== null && walletBalance > 0 && (
                            <div className={`p-4 mb-6 ${isDarkMode ? "bg-white/[0.03]" : "bg-black/5"}`}>
                                <div className="flex items-center gap-2 mb-3">
                                    <Coins className={`h-4 w-4 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
                                    <span className={`text-[10px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                                        Wallet — {walletBalance} coins
                                    </span>
                                </div>

                                <button
                                    onClick={() => setUseCoins(!useCoins)}
                                    className={`upgrade-btn hover:scale-105 hover:shadow-[0_0_30px_rgba(0,221,221,0.5)] transition-all duration-300 flex items-center justify-between px-4`}
                                >
                                    <div className="bubble-layer bubble-1"></div>
                                    <div className="bubble-layer bubble-2"></div>
                                    <div className="bubble-layer bubble-3"></div>
                                    <div className="bubble-layer bubble-4"></div>
                                    <div className="bubble-layer bubble-5"></div>
                                    <div className="bubble-layer bubble-6"></div>
                                    <div className="bubble-layer bubble-7"></div>
                                    <span className="z-15">{useCoins ? "Using coins" : "Use your coins"}</span>
                                    <span className="z-15">{useCoins ? `-₹${savings}` : `${walletBalance} available`}</span>
                                </button>

                                {useCoins && savings > 0 && (
                                    <p className={`text-[10px] mt-2 ${isDarkMode ? "text-green-400/80" : "text-green-600/80"}`}>
                                        Saving ₹{savings} — {discountedPrice > 0 ? `Pay ₹${discountedPrice}` : "Free"}
                                    </p>
                                )}
                                {walletBalance >= planPrice && !useCoins && (
                                    <p className={`text-[9px] font-mono mt-1 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                                        Tip: You can also buy directly with coins from the Wallet section.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Pay Button */}
                        <button
                            onClick={() => { setCheckoutPlan(null); handleRazorpayPayment(checkoutPlan, useCoins ? coinsToUse : 0) }}
                            disabled={processingPlanId === String(checkoutPlan.id)}
                            className={`w-full py-4 font-sans font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
                            style={{ fontSize: "11px", letterSpacing: "0.2em" }}
                        >
                            {processingPlanId === String(checkoutPlan.id)
                                ? "Processing..."
                                : useCoins && savings > 0
                                    ? `Pay ₹${discountedPrice.toLocaleString()} via Razorpay`
                                    : `Pay ₹${planPrice.toLocaleString()} via Razorpay`
                            }
                        </button>
                    </motion.div>
                </div>
                );
            })()}

            <Footer />
        </div>
    );
};

export default function Pricing() {
    return (
        <ThemeProvider>
            <PricingContent />
        </ThemeProvider>
    );
}
