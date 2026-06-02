"use client"

import { useState, useEffect, useCallback } from "react"
import { Wallet, Copy, Check, Gift, ArrowUpRight, Loader2, Coins, TrendingUp, Users, Sparkles } from "lucide-react"
import { getWalletProfile, getReferralStats, applyReferralCode, WalletProfileResponse, ReferralStatsResponse } from "@/lib/chat-api"
import { toast } from "sonner"

interface WalletPanelProps {
  isDarkMode: boolean
  isMobile: boolean
}

export default function WalletPanel({ isDarkMode, isMobile }: WalletPanelProps) {
  const [wallet, setWallet] = useState<WalletProfileResponse | null>(null)
  const [referralStats, setReferralStats] = useState<ReferralStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [referralInput, setReferralInput] = useState("")
  const [isApplying, setIsApplying] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [walletData, statsData] = await Promise.all([
        getWalletProfile(),
        getReferralStats().catch(() => null),
      ])
      setWallet(walletData)
      setReferralStats(statsData)
    } catch (err: any) {
      console.warn("Failed to load wallet data:", err.message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleApplyReferral = async () => {
    const code = referralInput.trim()
    if (!code) {
      toast.error("Please enter a referral code")
      return
    }
    setIsApplying(true)
    try {
      await applyReferralCode(code)
      toast.success("Referral code applied! You earned 10 coins.")
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className={`h-6 w-6 animate-spin ${isDarkMode ? "text-white/30" : "text-black/30"}`} />
      </div>
    )
  }

  return (
    <div className={`flex-1 ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"} overflow-y-auto`}>
      <div className="p-6 space-y-8">

        {/* Balance Card */}
        <div className={`p-6 ${isDarkMode ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"} border`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`h-8 w-8 flex items-center justify-center ${isDarkMode ? "bg-white/10" : "bg-black/10"}`}>
              <Wallet className={`h-4 w-4 ${isDarkMode ? "text-white" : "text-black"}`} />
            </div>
            <div>
              <p className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                Wallet Balance
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold tracking-tight" style={{ fontSize: "36px" }}>
              {wallet?.wallet_balance ?? 0}
            </span>
            <span className={`text-[10px] font-mono uppercase tracking-widest ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
              coins
            </span>
          </div>
          <div className="flex gap-6 mt-4">
            <div>
              <p className={`text-[8px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                Earned
              </p>
              <p className={`text-sm font-bold ${isDarkMode ? "text-white/70" : "text-black/70"}`}>
                {wallet?.total_earned ?? 0}
              </p>
            </div>
            <div>
              <p className={`text-[8px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                Redeemed
              </p>
              <p className={`text-sm font-bold ${isDarkMode ? "text-white/70" : "text-black/70"}`}>
                {wallet?.total_redeemed ?? 0}
              </p>
            </div>
          </div>
        </div>

        {/* Referral Code Entry */}
        {!wallet?.referral_code && (
          <div className={`p-5 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Gift className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
              <p className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                Have a referral code?
              </p>
            </div>
            <p className={`text-[11px] mb-4 ${isDarkMode ? "text-white/50" : "text-black/50"}`}>
              Enter a friend&apos;s referral code and earn 10 coins instantly!
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className={`flex-1 px-3 py-2.5 text-[11px] font-mono uppercase tracking-widest border ${isDarkMode ? "bg-transparent border-white/20 text-white placeholder:text-white/20" : "bg-transparent border-black/20 text-black placeholder:text-black/20"} focus:outline-none focus:border-[#00DDDD] transition-colors`}
                maxLength={20}
              />
              <button
                onClick={handleApplyReferral}
                disabled={isApplying || !referralInput.trim()}
                className={`px-4 py-2.5 text-[9px] font-mono font-bold uppercase tracking-[0.2em] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? "bg-white text-black hover:bg-white/90" : "bg-black text-white hover:bg-black/90"}`}
              >
                {isApplying ? "..." : "Apply"}
              </button>
            </div>
          </div>
        )}

        {/* My Referral Code */}
        {referralStats?.my_referral_code && (
          <div className={`p-5 border ${isDarkMode ? "border-white/10" : "border-black/10"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Users className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
              <p className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                Your Referral Code
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className={`flex-1 px-3 py-2 text-sm font-mono font-bold tracking-widest ${isDarkMode ? "bg-white/10 text-[#00DDDD]" : "bg-black/10 text-[#00DDDD]"}`}>
                {referralStats.my_referral_code}
              </code>
              <button
                onClick={handleCopyCode}
                className={`h-9 w-9 flex items-center justify-center border ${isDarkMode ? "border-white/20 hover:bg-white/10 text-white/60" : "border-black/20 hover:bg-black/10 text-black/60"} transition-colors`}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className={`text-[10px] mt-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
              Share this code with friends. When they purchase a plan, you earn coins!
            </p>
            <div className="flex gap-4 mt-3">
              <div>
                <p className={`text-[8px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                  Referrals
                </p>
                <p className="text-sm font-bold text-[#00DDDD]">{referralStats.total_referrals}</p>
              </div>
              <div>
                <p className={`text-[8px] font-mono uppercase tracking-[0.2em] ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                  Paid Referrals
                </p>
                <p className="text-sm font-bold text-[#00DDDD]">{referralStats.paid_referrals}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {wallet?.recent_transactions && wallet.recent_transactions.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
              <p className={`text-[8px] font-mono uppercase tracking-[0.3em] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
                Transaction History
              </p>
            </div>
            <div className="space-y-2">
              {wallet.recent_transactions.slice(0, 10).map((tx, i) => {
                const Icon = getTransactionIcon(tx.type)
                const isCredit = tx.type !== "PURCHASE_REDEEM"
                return (
                  <div key={tx.id || i} className={`flex items-start gap-3 p-3 ${isDarkMode ? "bg-white/[0.02]" : "bg-black/[0.02]"}`}>
                    <div className={`h-7 w-7 flex items-center justify-center shrink-0 ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                      <Icon className={`h-3 w-3 ${isDarkMode ? "text-white/40" : "text-black/40"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-medium truncate ${isDarkMode ? "text-white/70" : "text-black/70"}`}>
                        {tx.description}
                      </p>
                      <p className={`text-[8px] font-mono mt-0.5 ${isDarkMode ? "text-white/30" : "text-black/30"}`}>
                        {formatDate(tx.created_at)}
                      </p>
                    </div>
                    <span className={`text-[11px] font-bold font-mono shrink-0 ${isCredit ? "text-green-400" : "text-red-400"}`}>
                      {isCredit ? "+" : "-"}{tx.amount}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {wallet?.recent_transactions && wallet.recent_transactions.length === 0 && (
          <div className="text-center py-8">
            <Coins className={`h-8 w-8 mx-auto mb-3 ${isDarkMode ? "text-white/20" : "text-black/20"}`} />
            <p className={`text-[11px] ${isDarkMode ? "text-white/40" : "text-black/40"}`}>
              No transactions yet
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
