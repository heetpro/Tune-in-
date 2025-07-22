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
    <div className={`${spaceGrotesk.className} w-full h-[14vh] `}
style={{
  padding: 'clamp(0.5rem, 0.25vw, 200rem)',
}}
    >
      <div className="flex items-start gap-2 h-full w-full">
        <div className="w-fit h-full">
          <Logo2 />
        </div>
        <div className="flex gap-2 h-full">
          {user && (
            <>
              <div className="relative h-full aspect-square rounded-2xl border-4 border-[#8D50F9] overflow-hidden"
                onClick={() => { setIsOpen(true) }}
              >
                {user.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt={user.displayName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-3xl text-black/30">
                      {user.displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className={`flex justify-end pb-1 h-full py-2 px-3 rounded-2xl w-[200px] bg-[#8D50F9] flex-col `}>
                <span className="font-semibold text-white text-xl">{user.displayName}</span>
                {user.username && (
                  <span className="text-sm text-white/80 -mt-1 font-medium">@{user.username}</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="bg-[#8D50F9] rounded-2xl p-2  aspect-square h-full flex items-center justify-center">
          <div className="flex rounded-full bg-white p-1"
            style={{
              width: 'clamp(20px, 1.25vw, 100px)',
              height: 'clamp(20px, 1.25vw, 100px)',
            }}
          >

          </div>
        </div>


          
        <div className="flex overflow-hidden cursor-pointer justify-end h-full rounded-2xl w-[9vw] bg-[#8D50F9] relative flex-col"
        onMouseEnter={() => setIsFriendsOpen(true)}
        onMouseLeave={() => setIsFriendsOpen(false)}
        >
        <PersonStanding className={`text-white w-8 h-8  m-1.5 border-4bu border-white rounded-full z-50 absolute spin-animation ${isFriendsOpen ? 'shake-animation scale-150 m-3 transition-all duration-300' : 'bg-transparent scale-100 transition-all duration-300'}`} />
        {/* <div className={`flex px-11  py-2.5 absolute z-50 bottom-0 left-0 text-white text-md font-semibold ${isFriendsOpen ? 'translate-x-52  transition-all duration-300' : 'translate-0  transition-all duration-300'}`}>Friends</div> */}


        
        <Image src="/gifs/listen.gif" alt="friends"
        className={`object-cover h-full z-30 w-auto ${isFriendsOpen ? 'opacity-100  transition-all duration-300' : 'opacity-70  transition-all duration-300'}`}
        width={100} height={100} />
        </div>

      </div>

      {/* Move ProfileModal outside the conditional rendering */}
      {user && (
        <ProfileModal isOpen={isOpen} onClose={() => setIsOpen(false)} user={user} />
      )}
    </div>
  )
}

export default Navbar
