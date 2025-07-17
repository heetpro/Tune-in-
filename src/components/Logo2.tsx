import Image from 'next/image'
import React from 'react'

const Logo2 = () => {
  return (
    <div className='flex items-center w-fit aspect-square bg-[#964FFF] rounded-2xl gap-1.5'>
      <Image src="logo/logo.svg" alt="Logo" width={100} height={100} className='scale-75 aspect-square' />
    </div>
  )
}

export default Logo2
