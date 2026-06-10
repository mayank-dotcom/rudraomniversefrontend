"use client"

import { useState, useEffect, useCallback } from "react"
import { Wallet, Copy, Check, Gift, ArrowUpRight, Loader2, Coins, TrendingUp, Users, Sparkles, Search } from "lucide-react"
import { getWalletProfile, getReferralStats, applyReferralCode, WalletProfileResponse, ReferralStatsResponse } from "@/lib/chat-api"
import { toast } from "sonner"

interface WalletPanelProps {
  isDarkMode: boolean
  isMobile: boolean
}

const spinSlow = { animation: 'spin 3s linear infinite' }

export default function WalletPanel({ isDarkMode, isMobile }: WalletPanelProps) {
  const [wallet, setWallet] = useState<WalletProfileResponse | null>(null)
  const [referralStats, setReferralStats] = useState<ReferralStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [referralInput, setReferralInput] = useState("")
  const [isApplying, setIsApplying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [referralApplied, setReferralApplied] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [walletTab, setWalletTab] = useState<"coins" | "referral" | "history">("coins")
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const [walletData, statsData] = await Promise.all([
        getWalletProfile(),
        getReferralStats().catch(() => null),
      ])
      setWallet(walletData)
      setReferralStats(statsData)
    } catch (err: any) {
      console.warn("Failed to load wallet data:", err.message)
      setFetchError(err.message || "Failed to load wallet data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const hasWelcomeBonus = wallet?.recent_transactions?.some(tx => tx.type === 'WELCOME_BONUS') ?? false

  const hasEnteredReferral = wallet?.referral_code_entered || referralApplied

  const handleApplyReferral = async () => {
    const code = referralInput.trim()
    if (!code) {
      toast.error("Please enter a referral code")
      return
    }
    setIsApplying(true)
    try {
      await applyReferralCode(code)
      setReferralApplied(true)
      toast.success(hasWelcomeBonus
        ? "Referral code applied! You now get 20% discount on plan purchases."
        : "Referral code applied! You earned 10 coins.")
      setReferralInput("")
      fetchData()
    } catch (err: any) {
      toast.error(err.message || "Failed to apply referral code")
    } finally {
      setIsApplying(false)
    }
  }

  const handleCopyCode = async () => {
    const code = referralStats?.my_referral_code || wallet?.referral_code
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      toast.success("Referral code copied!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    } catch {
      return dateStr
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "WELCOME_BONUS": return Gift
      case "REFERRAL_REWARD": return Users
      case "PURCHASE_REDEEM": return ArrowUpRight
      case "ADMIN_ADJUSTMENT": return Sparkles
      default: return Coins
    }
  }

  const tabClass = (tab: "coins" | "referral" | "history") => {
    const active = walletTab === tab
    return `flex-1 py-2.5 text-[9px] font-mono font-bold uppercase tracking-[0.2em] transition-all ${
      active
        ? isDarkMode
          ? "bg-white text-black"
          : "text-white"
        : isDarkMode
          ? "text-white/40 hover:text-white hover:bg-white/5"
          : "text-black hover:bg-black/5"
    }`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className={`h-6 w-6 animate-spin ${isDarkMode ? "text-white/30" : "text-black/30"}`} />
      </div>
    )
  }

  return (
    <div className={`flex-1 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"} overflow-y-auto`}>
      <div className="p-4 space-y-5">

        {/* Tab Bar */}
        <div className={`flex gap-1 border-2 ${isDarkMode ? "border-white/30" : "border-black"}`}>
          <button onClick={() => setWalletTab("coins")} className={tabClass("coins")} style={walletTab === "coins" && !isDarkMode ? { backgroundColor: "var(--brand-accent)" } : undefined}>
            <div className="flex items-center justify-center gap-1.5">
              <Wallet className="h-3 w-3" />
              Coins
            </div>
          </button>
          <button onClick={() => setWalletTab("referral")} className={tabClass("referral")} style={walletTab === "referral" && !isDarkMode ? { backgroundColor: "var(--brand-accent)" } : undefined}>
            <div className="flex items-center justify-center gap-1.5">
              <Users className="h-3 w-3" />
              Referral
            </div>
          </button>
          <button onClick={() => setWalletTab("history")} className={tabClass("history")} style={walletTab === "history" && !isDarkMode ? { backgroundColor: "var(--brand-accent)" } : undefined}>
            <div className="flex items-center justify-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              History
            </div>
          </button>
        </div>

        {/* Coins Tab */}
        {walletTab === "coins" && (
          <div className={`relative overflow-hidden p-5 border-2 min-h-[320px] flex flex-col justify-between ${isDarkMode ? "bg-white/10 border-white/30" : "bg-black/5 border-black"}`}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-5">
                <div className={`h-6 w-6 flex items-center justify-center rounded-full ${isDarkMode ? "bg-white/10" : "bg-black/10"}`}>
                  <Coins className="h-3 w-3 text-yellow-500" style={spinSlow} />
                </div>
                <p className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/60" : "text-black"}`}>
                  Current Balance
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-bold tracking-tight text-yellow-500" style={{ fontSize: "48px", lineHeight: 1 }}>
                  {wallet?.wallet_balance ?? 0}
                </span>
                <span className={`text-[9px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/40" : "text-black/50"}`}>
                  coins
                </span>
              </div>
              <p className={`text-[9px] font-mono mt-1 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                Available balance
              </p>
            </div>
            <div className={`relative z-10 pt-4 border-t-2 ${isDarkMode ? "border-white/20" : "border-black/20"}`}>
              <div className="flex gap-8">
                <div>
                  <p className={`text-[7px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                    Total Earned
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <Coins className="h-2.5 w-2.5 text-yellow-500" />
                    <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                      {wallet?.total_earned ?? 0}
                    </p>
                  </div>
                </div>
                <div>
                  <p className={`text-[7px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                    Redeemed
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <ArrowUpRight className="h-2.5 w-2.5 text-red-400" />
                    <p className={`text-sm font-bold ${isDarkMode ? "text-white" : "text-black"}`}>
                      {wallet?.total_redeemed ?? 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className={`absolute -right-10 -top-10 w-44 h-44 rounded-full border-[12px] ${isDarkMode ? "border-yellow-500/10" : "border-yellow-500/20"}`} />
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full border-8 ${isDarkMode ? "border-yellow-500/8" : "border-yellow-500/15"}`} />
          </div>
        )}

        {/* Referral Tab */}
        {walletTab === "referral" && (
          <div className="space-y-4">
            {/* Enter Referral Code - hidden after use */}
            {!hasEnteredReferral && (
              <div className={`p-5 border-2 min-h-[240px] ${isDarkMode ? "bg-white/10 border-white/30" : "bg-black/5 border-black"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-3.5 w-3.5 text-yellow-500" />
                  <p className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/60" : "text-black"}`}>
                    Have a referral code?
                  </p>
                </div>
                <p className={`text-[11px] mb-4 ${isDarkMode ? "text-white/70" : "text-black"}`}>
                  {hasWelcomeBonus
                    ? "Enter a referral code and get 20% discount on plan purchases!"
                    : "Enter a friend&apos;s referral code and earn 10 coins instantly!"}
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={referralInput}
                    onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className={`w-full px-3 py-2.5 text-[11px] font-mono uppercase tracking-widest border-2 ${isDarkMode ? "bg-white/5 border-white/30 text-white placeholder:text-white/40" : "bg-transparent border-black text-black placeholder:text-black"} focus:outline-none focus:border-[var(--brand-accent)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
                    maxLength={20}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyReferral()}
                  />
                  <button
                    onClick={handleApplyReferral}
                    disabled={isApplying || !referralInput.trim()}
                    className={`w-full px-4 py-2.5 text-[9px] font-mono font-bold uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed border-2 ${isDarkMode ? "bg-white text-black border-white/10 hover:bg-white/90" : "bg-white text-black border-black hover:bg-black/90"}`}
                  >
                    {isApplying ? "..." : "Apply"}
                  </button>
                </div>
                {fetchError && (
                  <p className="text-[9px] mt-2 text-red-400 font-mono">{fetchError}</p>
                )}
              </div>
            )}

            {/* Share Your Referral Code */}
            {referralStats?.my_referral_code && (
              <div className={`p-5 border-2 min-h-[240px] ${isDarkMode ? "bg-white/10 border-white/30" : "bg-black/5 border-black"}`}>
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-3.5 w-3.5 text-yellow-500" />
                  <p className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/60" : "text-black"}`}>
                    Share Your Referral Code
                  </p>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <code className={`flex-1 px-3 py-2 text-sm font-mono font-bold tracking-widest ${isDarkMode ? "bg-white/10" : "bg-black/10"}`} style={{ color: "var(--brand-accent)" }}>
                    {referralStats.my_referral_code}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className={`h-9 w-9 flex items-center justify-center border-2 ${isDarkMode ? "border-white/20 hover:bg-white/10 text-white/60" : "border-black hover:bg-black/10 text-black"} transition-colors`}
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className={`text-[10px] ${isDarkMode ? "text-white/60" : "text-black"}`}>
                  Share this code with friends. When they purchase a plan, you earn coins!
                </p>
                <div className={`flex gap-4 mt-4 pt-3 border-t-2 ${isDarkMode ? "border-white/20" : "border-black/20"}`}>
                  <div>
                    <p className={`text-[8px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/50" : "text-black"}`}>
                      Referrals
                    </p>
                    <p className="text-sm font-bold" style={{ color: "var(--brand-accent)" }}>{referralStats.total_referrals}</p>
                  </div>
                  <div>
                    <p className={`text-[8px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/50" : "text-black"}`}>
                      Paid Referrals
                    </p>
                    <p className="text-sm font-bold" style={{ color: "var(--brand-accent)" }}>{referralStats.paid_referrals}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {walletTab === "history" && (
          <>
            <div className={`border-2 ${isDarkMode ? "border-white/30" : "border-black"}`}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <TrendingUp className={`h-3 w-3 shrink-0 ${isDarkMode ? "text-white/50" : "text-black/50"}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search transactions..."
                  className={`w-full text-[10px] font-mono bg-transparent border-none outline-none ${isDarkMode ? "text-white placeholder:text-white/40" : "text-black placeholder:text-black/40"}`}
                />
              </div>
            </div>
            {wallet?.recent_transactions && wallet.recent_transactions.length > 0 ? (
              <div className="space-y-2 min-h-[240px] max-h-[400px] overflow-y-auto">
                {wallet.recent_transactions
                  .filter((tx) =>
                    !searchQuery || tx.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .slice(0, 20)
                  .map((tx, i) => {
                    const Icon = getTransactionIcon(tx.type)
                    const isCredit = tx.type !== "PURCHASE_REDEEM"
                    return (
                      <div key={tx.id || i} className={`flex items-start gap-3 p-3 border-2 ${isDarkMode ? "bg-white/[0.06] border-white/30" : "bg-black/[0.02] border-black"}`}>
                        <div className={`h-7 w-7 flex items-center justify-center shrink-0 ${isDarkMode ? "bg-white/10" : "bg-black/5"}`}>
                          <Icon className="h-3 w-3 text-yellow-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-[10px] font-medium truncate ${isDarkMode ? "text-white" : "text-black"}`}>
                            {tx.description}
                          </p>
                          <p className={`text-[8px] font-mono mt-0.5 ${isDarkMode ? "text-white/50" : "text-black/60"}`}>
                            {formatDate(tx.created_at)}
                          </p>
                        </div>
                        <span className={`text-[11px] font-bold font-mono shrink-0 ${isCredit ? "text-green-400" : "text-red-400"}`}>
                          {isCredit ? "+" : "-"}{tx.amount}
                        </span>
                      </div>
                    )
                  })}
                {wallet.recent_transactions.filter((tx) =>
                  !searchQuery || tx.description?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                  <div className="text-center py-8 min-h-[240px] flex flex-col items-center justify-center">
                    <Search className="h-6 w-6 mx-auto mb-3 text-yellow-500/40" />
                    <p className={`text-[11px] ${isDarkMode ? "text-white/60" : "text-black/40"}`}>
                      No matching transactions
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 min-h-[240px] flex flex-col items-center justify-center">
                <Coins className="h-8 w-8 mx-auto mb-3 text-yellow-500/40" />
                <p className={`text-[11px] ${isDarkMode ? "text-white/60" : "text-black/40"}`}>
                  No transactions yet
                </p>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
