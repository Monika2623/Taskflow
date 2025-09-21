import React from 'react'

interface BadgeProps {
  text: string
  color?: 'red' | 'green' | 'yellow' | 'blue' | 'gray'
}

const colorClasses = {
  red: 'bg-red-600 text-white',
  green: 'bg-green-600 text-white',
  yellow: 'bg-yellow-500 text-white',
  blue: 'bg-blue-600 text-white',
  gray: 'bg-gray-400 text-white',
}

const Badge: React.FC<BadgeProps> = ({ text, color = 'gray' }) => {
  return <span className={`px-2 py-0.5 rounded text-xs ${colorClasses[color]}`}>{text}</span>
}

export default Badge
