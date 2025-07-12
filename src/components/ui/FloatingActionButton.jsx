'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

const FloatingActionButton = () => {
    const [isHovered, setIsHovered] = useState(false)
    const router = useRouter()

    const handleClick = () => {
        // Navigate to create post page or open create modal
        router.push('/create') // Assuming you have a create route
    }

    return (
        <button
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 text-white rounded-full shadow-lg hover:shadow-xl dark:shadow-neutral-900/50 transition-all duration-300 transform ${
                isHovered ? 'scale-110' : 'scale-100'
            } z-50 flex items-center justify-center`}
        >
            <svg
                className={`w-6 h-6 transition-transform duration-300 ${
                    isHovered ? 'rotate-90' : 'rotate-0'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                />
            </svg>
        </button>
    )
}

export default FloatingActionButton
