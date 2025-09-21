import React from 'react'

interface AvatarProps {
  name: string
  size?: number
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 32 }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()

  return (
    <div
      style={{ width: size, height: size, fontSize: size / 2 }}
      className="rounded-full bg-gray-400 text-white flex items-center justify-center select-none"
    >
      {initials}
    </div>
  )
}

export default Avatar
