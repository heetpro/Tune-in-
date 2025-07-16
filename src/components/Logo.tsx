import Image from 'next/image'
import React from 'react'

const Logo = () => {
  return (
    <div className='flex items-center gap-1.5'>
      <Image src="logo/logo.svg" alt="Logo" width={100} height={100} className='scale-75' />
    </div>
  )
}

export default Logo
