'use client'
import { useAuth } from '@/context/AuthContext'
import React, { useState } from 'react'
import Logo2 from './Logo2'
import Image from 'next/image'
import { spaceGrotesk } from '@/app/fonts'
import { ProfileModal } from './ProfileModal'
import { FileUser, PersonStanding, UserRound, Users, UsersRound } from 'lucide-react'

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isFriendsOpen, setIsFriendsOpen] = useState(false)
  const { user } = useAuth()
  return (
    <div className={`${spaceGrotesk.className} w-full h-full overflow-hidden `}
      style={{
        // padding: 'clamp(0.5rem, 0.25vw, 200rem)',
      }}
    >
      <div className="flex items-start gap-2 h-full w-full">
        <div className="w-[30%] h-full">
          <Logo2 />
        </div>
        <div className="flex gap-2 h-full w-full">
          {user && (
            <div className='h-full flex w-full'>
              <div className="relative w-auto  h-full aspect-square rounded-2xl border-4 border-[#fff] overflow-hidden"
                onClick={() => { setIsOpen(true) }}
              >
                {user.profilePicture ? (
                  <div className='flex items-center w-full h-full gap-1.5'>
                    <Image
                      src={user.profilePicture}
                      alt={user.displayName}
                      width={200}
                      height={200}
                      className="object-cover cursor-pointer w-full h-full aspect-square"
                    />
                  </div>

                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl text-black/30">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className={`flex justify-end pb-1 h-full py-2 px-3 rounded-2xl  bg-[#151312] flex-col`}>
                <span className="font-semibold text-white"
                style={{
                  fontSize: "clamp(1rem, 1.2vw, 180rem)"
                }}
                >{user.displayName}</span>
                {user.username && (
                  <span
                          style={{
                  fontSize: "clamp(0.76rem, 0.85vw, 180rem)"
                }}
                  className="text-white/80 -mt-1 font-medium">@{user.username}</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* <div className="bg-[#151312] rounded-2xl p-2  aspect-square h-full flex items-center justify-center">
          <div className="flex rounded-full bg-white p-1"
            style={{
              width: 'clamp(20px, 1.25vw, 100px)',
              height: 'clamp(20px, 1.25vw, 100px)',
            }}
          >

          </div>
        </div> */}



        {/* <div className="flex overflow-hidden cursor-pointer justify-end h-full rounded-2xl w-[9vw] bg-[#151312] relative flex-col"
          onMouseEnter={() => setIsFriendsOpen(true)}
          onMouseLeave={() => setIsFriendsOpen(false)}
        >
          <PersonStanding className={`text-white w-8 h-8  m-1.5 border-4bu border-white rounded-full z-50 absolute spin-animation ${isFriendsOpen ? 'shake-animation scale-150 m-3 transition-all duration-300' : 'bg-transparent scale-100 transition-all duration-300'}`} />



          <Image src="/gifs/listen.gif" alt="friends"
            className={`object-cover h-full z-30 w-auto ${isFriendsOpen ? 'opacity-100  transition-all duration-300' : 'opacity-70  transition-all duration-300'}`}
            width={100} height={100} />
        </div> */}

      </div>

      {user && (
        <ProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} user={user} />
      )}
    </div>
  )
}

export default Navbar
