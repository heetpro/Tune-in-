import Image from 'next/image'
import React from 'react'

const Logo = () => {
  return (
    <div className='flex items-center gap-1.5'>
      <Image src="logo/logo.svg" alt="Logo" width={100} height={100} className='w-10 h-10' />
      <div className="flex text-white text-xl">urflower</div>
    </div>
  )
}

export default Logo
