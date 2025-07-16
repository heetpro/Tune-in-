import { spaceGrotesk } from '@/app/fonts'
import React from 'react'

const Info = () => {
  return (
    <div className='w-[80%] bg-white min-h-[100vh] flex justify-between'>
      <div className={`${spaceGrotesk.className} text-9xl font-bold tracking-tighter text-black uppercase`}>We’re not just for dating</div>
    </div>
  )
}

export default Info
