"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Eye, EyeOff } from "lucide-react"
import { accessCodeService, userProgressService } from "@/lib/database"

interface AccessCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onAccessGranted: (code: string) => void
}

export function AccessCodeModal({ isOpen, onClose, onAccessGranted }: AccessCodeModalProps) {
  const [accessCode, setAccessCode] = useState("")
  const [showCode, setShowCode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      setAccessCode("")
      setError("")
      setShowCode(false)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessCode.trim()) {
      setError("Please enter an access code")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const codeData = await accessCodeService.findByCode(accessCode.trim().toUpperCase())

      if (!codeData) {
        setError("Invalid access code")
        return
      }

      if (!codeData.is_active) {
        setError("This access code has been deactivated")
        return
      }

      // Update last access time
      await accessCodeService.update(codeData.id, {
        last_access: new Date().toISOString(),
      })

      // Update or create user progress
      try {
        const existingProgress = await userProgressService.findByUserCode(accessCode.trim().toUpperCase())

        if (existingProgress) {
          await userProgressService.updateLoginCount(accessCode.trim().toUpperCase())
        } else {
          await userProgressService.upsert({
            user_code: accessCode.trim().toUpperCase(),
            customer_name: codeData.customer_name,
            completed_sessions: [],
            last_activity: new Date().toISOString(),
            login_count: 1,
          })
        }
      } catch (progressError) {
        console.error("Error updating user progress:", progressError)
        // Continue anyway as the main authentication succeeded
      }

      // Store in localStorage for session management
      localStorage.setItem("access_code", accessCode.trim().toUpperCase())
      localStorage.setItem("customer_name", codeData.customer_name)

      onAccessGranted(accessCode.trim().toUpperCase())
    } catch (error) {
      console.error("Error verifying access code:", error)
      setError("Error verifying access code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700 animate-fade-in-up">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#0fd8d7]">Enter Access Code</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Access Code</label>
            <div className="relative">
              <input
                type={showCode ? "text" : "password"}
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#0fd8d7] transition-colors pr-12"
                placeholder="Enter your 8-character code"
                maxLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                {showCode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] text-black font-semibold py-3 px-6 rounded-lg hover:from-[#0bc5c4] hover:to-[#0fd8d7] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Verifying..." : "Access Platform"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">Don't have an access code? Contact your instructor.</p>
        </div>
      </div>
    </div>
  )
}
