"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Cookie } from "lucide-react"

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const hasConsent = localStorage.getItem("cookieConsent")
    if (!hasConsent) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem("cookieConsent", "true")
    setIsVisible(false)
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-8 border border-gray-200 inset-x-0 mx-auto bg-white rounded-full p-4 z-50 max-w-2xl w-[90%]"
        >
          <div className="flex items-center gap-3">
            <Cookie className="h-6 w-6 text-gray-600 flex-shrink-0" />
            <p className="text-gray-700 text-sm">
              This website uses cookies to ensure you get the best experience.
            </p>
            <button
              onClick={handleAccept}
              className="text-sm font-medium px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors ml-auto"
            >
              Accept
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

