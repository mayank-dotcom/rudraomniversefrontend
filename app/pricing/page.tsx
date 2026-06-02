"use client"

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { ThemeProvider } from "@/lib/theme-context";
import { Zap, Code, Image as ImageIcon, GraduationCap, Building2, Loader2, ArrowRight, Volume2, Mic, Sparkles, X, Coins, Scan, Puzzle } from "lucide-react";
import { getPlansList, Plan, getPlanStrikeOff, getPublicSiteSettings, createPaymentOrder, verifyPayment, getWalletProfile } from "@/lib/chat-api";
import { getApiKey } from "@/lib/auth";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme-context";

declare global {
  interface Window {
    Razorpay: any
  }
}

const PricingContent = () => {
    const { isDarkMode } = useTheme();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [walletBalance, setWalletBalance] = useState<number | null>(null);

    const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

    const [checkoutPlan, setCheckoutPlan] = useState<Plan | null>(null);
    const [useCoins, setUseCoins] = useState(false);

    useEffect(() => {
        const apiKey = getApiKey();
        if (apiKey) {
            getWalletProfile()
                .then(data => setWalletBalance(data.wallet_balance))
                .catch(() => {});
        }
    }, []);

    const handleRazorpayPayment = useCallback(async (plan: Plan, coinsToUse: number = 0) => {
        const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!razorpayKeyId) {
            toast.error("Payment gateway is not configured. Please contact support.");
            return;
        }

        setProcessingPlanId(String(plan.id));
        try {
            const order = await createPaymentOrder(plan.id, coinsToUse > 0 ? coinsToUse : undefined);

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
    }, []);

    const handleSelectPlan = useCallback((plan: Plan) => {
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
        linkText: string;
        linkUrl: string;
    }>({
        title: "Quiet power.\nTailored access.",
        description: "Choose the level of intelligence that fits your workflow. From late-night study sessions to building the next big thing.",
        linkText: "Learn More",
        linkUrl: "/pricing"
    });

    useEffect(() => {
        getPublicSiteSettings().then(res => {
            const setting = res.settings?.find(s => s.key === "b2b_page");
            if (setting?.value) {
                try {
                    const parsed = JSON.parse(setting.value);
                    setPageData({
                        title: parsed.title || "Quiet power.\nTailored access.",
                        description: parsed.description || "Choose the level of intelligence that fits your workflow. From late-night study sessions to building the next big thing.",
                        linkText: parsed.linkText || "Learn More",
                        linkUrl: parsed.linkUrl || "/pricing"
                    });
                } catch (e) {
                    console.error("Error parsing B2B settings", e);
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
                        tokens: plan.daily_chat_limit || 0,
                        images: plan.monthly_image_limit || 0,
                        personas: plan.daily_coding_limit || 0,
                        daily_vision_limit: plan.daily_vision_limit || 0,
                        monthly_flux_limit: plan.monthly_flux_limit || 0,
                        daily_tts_limit: plan.daily_tts_limit || 0,
                        daily_stt_limit: plan.daily_stt_limit || 0
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
        if (planName.toLowerCase().includes('agenc')) return 'ENTERPRISE';
        return 'STANDARD';
    };

    const getMultiplierData = (planName: string) => {
        const list = [
            { keywords: ['free'], multiplier: '0.02x', tokens: '1K', features: [] as { icon: any; label: string; value: string }[] },
            { keywords: ['motion'], multiplier: '1x', tokens: '50K', features: [
                { icon: ImageIcon, label: 'Images', value: '2' },
                { icon: Scan, label: 'OCR', value: '5' },
                { icon: Puzzle, label: 'Extensions', value: '5' },
                { icon: Volume2, label: 'TTS', value: '1 Min' },
                { icon: Mic, label: 'STT', value: '1 Min' },
            ]},
            { keywords: ['speed'], multiplier: '10x', tokens: '500K', features: [
                { icon: ImageIcon, label: 'Images', value: '6' },
                { icon: Scan, label: 'OCR', value: '15' },
                { icon: Puzzle, label: 'Extensions', value: '15' },
                { icon: Volume2, label: 'TTS', value: '5 Min' },
                { icon: Mic, label: 'STT', value: '5 Min' },
            ]},
            { keywords: ['velocity'], multiplier: '16x', tokens: '800K', features: [
                { icon: ImageIcon, label: 'Images', value: '15' },
                { icon: Scan, label: 'OCR', value: '30' },
                { icon: Puzzle, label: 'Extensions', value: '30' },
                { icon: Volume2, label: 'TTS', value: '10 Min' },
                { icon: Mic, label: 'STT', value: '10 Min' },
            ]},
            { keywords: ['acceleration'], multiplier: '20x', tokens: '1M', features: [
                { icon: ImageIcon, label: 'Images', value: '50' },
                { icon: Scan, label: 'OCR', value: '60' },
                { icon: Puzzle, label: 'Extensions', value: '60' },
                { icon: Volume2, label: 'TTS', value: '60 Min' },
                { icon: Mic, label: 'STT', value: '60 Min' },
            ]},
            { keywords: ['agenc', 'heavy duty', 'enterprise'], multiplier: '100x', tokens: '5M', features: [
                { icon: ImageIcon, label: 'Images', value: '500' },
                { icon: Scan, label: 'OCR', value: '1000' },
                { icon: Puzzle, label: 'Extensions', value: '1000' },
                { icon: Volume2, label: 'TTS', value: '500 Min' },
                { icon: Mic, label: 'STT', value: '500 Min' },
            ]},
        ];
        const lower = planName.toLowerCase();
        return list.find(d => d.keywords.some(k => lower.includes(k))) || null;
    };

    if (isLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? "bg-[#0a0a0a]" : "bg-[#fdfdfd]"}`}>
                <Loader2 className={`h-8 w-8 animate-spin ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? "bg-[#0a0a0a] text-white" : "bg-[#fdfdfd] text-black"} selection:bg-[var(--color-cyan)] selection:text-white`}>
            <Navbar />

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
                                            <span className="italic text-[var(--color-cyan)]">{line}</span>
                                        ) : (
                                            line
                                        )}
                                    </span>
                                ))}
                            </h1>
                            {/* Body Copy — 16px Regular */}
                            <p 
                                className={`max-w-xl leading-relaxed ${isDarkMode ? "text-white/50" : "text-black/50"}`}
                                style={{ fontSize: "16px" }}
                            >
                                {pageData.description}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {plans.map((plan, i) => {
                            const Icon = getPlanIcon(plan.plan_name || '');
                            const tag = getPlanTag(plan.plan_name || '');
                            const isPro = plan.plan_name?.toLowerCase().includes('pro') || plan.plan_name?.toLowerCase().includes('developer');

                            return (
                                <motion.div
                                    key={plan.id || i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: i * 0.1 }}
                                    className={`relative p-10 flex flex-col border ${isDarkMode ? "border-white/20" : "border-black/10"} group transition-all duration-500 ${isPro ? (isDarkMode ? "bg-[#0d0d0d]" : "bg-white") : (isDarkMode ? "bg-transparent" : "bg-transparent")}`}
                                >
                                    {/* Plan Tag — Technical Label style */}
                                    <div className="flex justify-between items-center mb-16">
                                        <span 
                                            className={`font-sans font-bold uppercase ${isPro ? "text-[var(--color-cyan)]" : (isDarkMode ? "text-white/20" : "text-black/30")}`}
                                            style={{ fontSize: "11px", letterSpacing: "0.1em" }}
                                        >
                                            {tag}
                                        </span>
                                        {isPro && <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-cyan)] animate-pulse" />}
                                    </div>

                                    {/* Plan Title & Price */}
                                    <div className="mb-12">
                                        <h3 
                                            className="font-display font-semibold uppercase mb-4 tracking-tight"
                                            style={{ fontSize: "20px" }}
                                        >
                                            {plan.plan_name}
                                        </h3>
                                        <div className="flex items-baseline gap-2">
                                            {(() => {
                                                const strikeOff = getPlanStrikeOff(String(plan.id))
                                                if (strikeOff) {
                                                    return (
                                                        <>
                                                            <span className="font-display font-bold leading-none tracking-tighter line-through opacity-40" style={{ fontSize: "40px" }}>
                                                                ₹{plan.price_inr || plan.price}
                                                            </span>
                                                            <span className="font-display font-bold leading-none tracking-tighter text-[var(--color-cyan)]" style={{ fontSize: "40px" }}>
                                                                ₹{strikeOff.price_inr}
                                                            </span>
                                                        </>
                                                    )
                                                }
                                                return (
                                                    <span className="font-display font-bold leading-none tracking-tighter" style={{ fontSize: "40px" }}>
                                                        ₹{plan.price_inr || plan.price}
                                                    </span>
                                                )
                                            })()}
                                            <span className={`font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-black/30"}`} style={{ fontSize: "10px" }}>/mo</span>
                                        </div>
                                    </div>

                                    {/* Multiplier & Features */}
                                    <div className="flex-1 space-y-5 mb-16">
                                        {(() => {
                                            const md = getMultiplierData(plan.plan_name || '');
                                            if (md) {
                                                return (
                                                    <>
                                                        <div className="mb-6">
                                                            <span className={`font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/20" : "text-black/30"}`} style={{ fontSize: "10px", letterSpacing: "0.1em" }}>
                                                                Plan Tokens Multiplier
                                                            </span>
                                                            <div className="mt-2">
                                                                <span className="font-display font-bold tracking-tight text-[var(--color-cyan)]" style={{ fontSize: "40px" }}>
                                                                    {md.multiplier}
                                                                </span>
                                                                <p className={`font-sans font-bold uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/40"}`} style={{ fontSize: "11px" }}>
                                                                    {md.tokens} Tokens
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {md.features.map((f, idx) => (
                                                            <div key={idx} className="flex items-center gap-4">
                                                                <f.icon className={`h-4 w-4 shrink-0 ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
                                                                <p className={`text-[13px] font-medium ${isDarkMode ? "text-white/40" : "text-black/50"}`}>
                                                                    <span className={isDarkMode ? "text-white/60" : "text-black/70"}>{f.label}:</span> {f.value}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </>
                                                );
                                            }
                                            return (
                                                <>
                                                    {[
                                                        { icon: Zap, label: "Daily Chat", value: plan.daily_chat_limit },
                                                        { icon: Code, label: "Coding", value: plan.daily_coding_limit },
                                                        { icon: ImageIcon, label: "Vision", value: plan.daily_vision_limit },
                                                        { icon: ImageIcon, label: "Images/mo", value: plan.monthly_image_limit },
                                                        { icon: Sparkles, label: "Flux/mo", value: plan.monthly_flux_limit },
                                                        { icon: Volume2, label: "TTS", value: plan.daily_tts_limit },
                                                        { icon: Mic, label: "STT", value: plan.daily_stt_limit },
                                                    ].map((feature, idx) => (
                                                        <div key={idx} className="flex items-center gap-4">
                                                            <feature.icon className={`h-4 w-4 shrink-0 ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
                                                            <p className={`text-[13px] font-medium ${isDarkMode ? "text-white/40" : "text-black/50"}`}>
                                                                <span className={isDarkMode ? "text-white/60" : "text-black/70"}>{feature.label}:</span> {feature.value ?? 0}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Button — 14px Semi-Bold */}
                                    <button
                                        onClick={() => handleSelectPlan(plan)}
                                        disabled={processingPlanId === String(plan.id) || plan.price_inr === 0}
                                        className={`w-full py-4 font-sans font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${isPro ? (isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90") : (isDarkMode ? "border border-white/10 text-white hover:bg-white/5" : "border border-black/10 text-black hover:bg-black/5")}`}
                                        style={{ fontSize: "11px", letterSpacing: "0.2em" }}
                                    >
                                        {processingPlanId === String(plan.id) ? "Processing..." : plan.price_inr === 0 ? "Current Plan" : "Select Plan"}
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
                const planPrice = Number(checkoutPlan.price_inr || checkoutPlan.price);
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
                        className={`relative w-full max-w-md ${isDarkMode ? "bg-[#0a0a0a] border-white/10" : "bg-[#fcfcfc] border-black/10"} border p-8`}
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
                            {checkoutPlan.plan_name}
                        </h3>

                        {/* Price Display */}
                        <div className="flex items-baseline gap-2 mb-6">
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
                                /mo
                            </span>
                        </div>

                        {/* Wallet & Coin Discount */}
                        {walletBalance !== null && walletBalance > 0 && (
                            <div className={`p-4 mb-6 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
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
