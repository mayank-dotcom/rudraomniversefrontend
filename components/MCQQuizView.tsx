"use client"
import { useState } from "react"
import { motion } from "framer-motion"
import { X, Check, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react"

export interface MCQQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface MCQQuizViewProps {
  questions: MCQQuestion[]
  examType: string
  onClose: () => void
  isDarkMode: boolean
  inline?: boolean
}

function ScoreCircle({ score, total, isDarkMode }: { score: number; total: number; isDarkMode: boolean }) {
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (percentage / 100) * circumference
  const color = percentage >= 80 ? (isDarkMode ? "#ffffff" : "#000000") : percentage >= 50 ? "#666666" : "#ef4444"
  const trackColor = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"

  return (
    <div className="relative h-36 w-36">
      <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" stroke={trackColor} strokeWidth="8" fill="none" />
        <circle cx="50" cy="50" r="45" stroke={color} strokeWidth="8" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-display font-black ${isDarkMode ? "text-white" : "text-black"}`}>{percentage}%</span>
        <span className={`text-[9px] font-mono ${isDarkMode ? "text-white/60" : "text-black/50"} uppercase tracking-widest`}>{score}/{total}</span>
      </div>
    </div>
  )
}

export default function MCQQuizView({ questions, examType, onClose, isDarkMode, inline = false }: MCQQuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(questions.length).fill(null))
  const [showResults, setShowResults] = useState(false)

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1

  const handleSelect = (optionIndex: number) => {
    if (answers[currentIndex] !== null) return
    const newAnswers = [...answers]
    newAnswers[currentIndex] = optionIndex
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (isLast) setShowResults(true)
    else setCurrentIndex(currentIndex + 1)
  }

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  const score = answers.reduce<number>((acc, ans, i) => acc + (ans === questions[i].correctAnswer ? 1 : 0), 0)
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0
  const bg = isDarkMode ? "bg-[#0d0d0d]" : "bg-white"
  const border = isDarkMode ? "border-white/10" : "border-black/30"
  const text = isDarkMode ? "text-white" : "text-black"
  const textMuted = isDarkMode ? "text-white/40" : "text-black/40"
  const textDim = isDarkMode ? "text-white/60" : "text-black/60"

  if (showResults) {
    const resultsCard = (
      <div className={`w-full max-w-3xl ${inline ? "" : "max-h-[90vh]"} ${bg} border ${border} rounded-[2.5rem] overflow-y-auto ${isDarkMode ? "custom-scrollbar" : "light-scrollbar"}`}>
        <div className={`sticky top-0 ${bg} z-10 flex items-center justify-between p-8 border-b ${border}`}>
          <div>
            <h2 className={`text-xl font-display font-black uppercase tracking-tighter ${text}`}>Quiz Results</h2>
            <p className={`text-[10px] font-mono ${isDarkMode ? "text-white" : "text-black"} uppercase tracking-[0.3em]`}>{examType} • {questions.length} QUESTIONS</p>
          </div>
          <button onClick={onClose} className={`p-3 border ${border} ${textMuted} hover:${isDarkMode ? "text-white" : "text-black"} rounded-xl transition-all`}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex flex-col items-center py-8">
            <ScoreCircle score={score} total={questions.length} isDarkMode={isDarkMode} />
            <p className={`mt-4 text-[11px] font-mono ${textMuted} uppercase tracking-widest`}>
              {percentage >= 80 ? "Excellent Performance!" : percentage >= 50 ? "Good Effort!" : "Keep Practicing!"}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className={`text-[10px] font-mono uppercase tracking-[0.3em] ${textMuted} mb-6`}>Question Review</h3>
            {questions.map((q, i) => {
              const isCorrect = answers[i] === q.correctAnswer
              const userAns = answers[i]
              return (
                  <div key={i} className={`p-6 rounded-2xl border ${isCorrect ? `${border} ${isDarkMode ? "bg-white/5" : "bg-black/5"}` : "border-red-500/30 bg-red-500/5"}`}>
                  <div className="flex items-start gap-4">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? (isDarkMode ? "bg-white text-black" : "bg-black text-white") : "bg-red-500 text-white"}`}>
                      {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${text} mb-2`}>Q{i + 1}. {q.question}</p>
                      <div className="space-y-1.5">
                        {q.options.map((opt, oi) => {
                          const isUserAns = userAns === oi
                          const isCorrectAns = q.correctAnswer === oi
                            let optClass = textMuted
                            if (isCorrectAns) optClass = text
                            if (isUserAns && !isCorrectAns) optClass = "text-red-500"
                          return (
                            <p key={oi} className={`text-xs font-mono ${optClass}`}>
                              {isCorrectAns && <Check className="h-3 w-3 inline mr-1.5 -mt-0.5" />}
                              {isUserAns && !isCorrectAns && <X className="h-3 w-3 inline mr-1.5 -mt-0.5" />}
                              {opt}
                            </p>
                          )
                        })}
                      </div>
                      <p className={`mt-3 text-[11px] ${textDim} font-mono leading-relaxed`}>{q.explanation}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={onClose} className={`w-full py-4 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} text-[10px] font-mono font-black uppercase tracking-[0.3em] rounded-[2rem] hover:scale-[1.02] active:scale-[0.98] transition-all`}>
            Close Results
          </button>
        </div>
      </div>
    )

    if (inline) return <div className="w-full my-8">{resultsCard}</div>

    return (
      <div className={`fixed inset-0 z-[250] ${isDarkMode ? "bg-black/90" : "bg-white/90"} backdrop-blur-xl flex items-center justify-center p-4 md:p-10`}>
        {resultsCard}
      </div>
    )
  }

  const quizCard = (
    <motion.div
      key={currentIndex}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className={`w-full max-w-2xl ${bg} border ${border} rounded-[2.5rem] overflow-hidden`}
    >
      <div className={`flex items-center justify-between p-8 border-b ${border}`}>
        <div className="flex items-center gap-4">
          <div className={`h-10 w-10 ${isDarkMode ? "bg-white text-black" : "bg-black text-white"} rounded-xl flex items-center justify-center`}>
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h2 className={`text-lg font-display font-black uppercase tracking-tight ${text}`}>MCQ Quiz</h2>
            <p className={`text-[9px] font-mono ${isDarkMode ? "text-white" : "text-black"} uppercase tracking-[0.3em]`}>{examType}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <span className={`text-[10px] font-mono ${textMuted}`}>{currentIndex + 1} / {questions.length}</span>
          <button onClick={onClose} className={`p-2 border ${border} ${textMuted} hover:${isDarkMode ? "text-white" : "text-black"} rounded-xl transition-all`}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {currentQuestion && (
        <div className="p-8 space-y-8">
          <p className={`text-lg font-medium leading-relaxed ${text}`}>{currentQuestion.question}</p>

          <div className="space-y-3">
            {currentQuestion.options.map((opt, oi) => {
              const isSelected = answers[currentIndex] === oi
              return (
                <button
                  key={oi}
                  onClick={() => handleSelect(oi)}
                  disabled={answers[currentIndex] !== null}
                    className={`w-full text-left p-5 rounded-2xl border text-sm font-mono transition-all ${
                      isSelected
                        ? `${isDarkMode ? "bg-white text-black border-white" : "bg-black text-white border-black"} font-bold scale-[1.02]`
                        : answers[currentIndex] !== null
                          ? `${border} ${isDarkMode ? "text-white/30" : "text-black/30"}`
                          : `${border} ${isDarkMode ? "text-white/70 hover:border-white/30 hover:bg-white/5" : "text-black/70 hover:border-black/30 hover:bg-black/5"}`
                    }`}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all ${
                currentIndex === 0
                  ? textMuted
                  : `border ${border} ${textMuted} hover:${isDarkMode ? "text-white hover:border-white/30" : "text-black hover:border-black/30"}`
              }`}
            >
              <ChevronLeft className="h-3 w-3" /> Previous
            </button>

            <button
              onClick={handleNext}
              disabled={answers[currentIndex] === null}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-mono font-bold uppercase tracking-widest transition-all ${
                answers[currentIndex] !== null
                  ? `${isDarkMode ? "bg-white text-black" : "bg-black text-white"} hover:scale-105`
                  : `${isDarkMode ? "bg-white/10 text-white/30" : "bg-black/10 text-black/30"}`
              }`}
            >
              {isLast ? "View Results" : "Next"} <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )

  if (inline) return <div className="w-full my-8">{quizCard}</div>

  return (
    <div className={`fixed inset-0 z-[250] ${isDarkMode ? "bg-black/90" : "bg-white/90"} backdrop-blur-xl flex items-center justify-center p-4 md:p-10`}>
      {quizCard}
    </div>
  )
}
