'use client'
import React, { useState, useEffect } from 'react'

const BackToTop = () => {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.pageYOffset > 300) {
                setIsVisible(true)
            } else {
                setIsVisible(false)
            }
        }

        window.addEventListener('scroll', toggleVisibility)

        return () => window.removeEventListener('scroll', toggleVisibility)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    if (!isVisible) {
        return null
    }

    return (
        <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 w-12 h-12 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full shadow-lg hover:shadow-xl dark:shadow-neutral-900/50 transition-all duration-300 transform hover:scale-110 z-40 flex items-center justify-center border border-neutral-200 dark:border-neutral-700"
            aria-label="Back to top"
        >
            <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
            </svg>
        </button>
    )
}

export default BackToTop
