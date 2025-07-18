import { useAuth } from '@/context/AuthContext'
import React from 'react'
import Logo2 from './Logo2'
import Image from 'next/image'
import { spaceGrotesk } from '@/app/fonts'

const Navbar = () => {

    const {user} = useAuth()
  return (
    <div className="w-full h-[14vh] p-3">
      <div className="flex items-start gap-2 h-full w-full">
          <Logo2 />
          <div className="flex gap-2 h-full">
            {user && (
              <>
                <div className="relative w-[100px] h-full aspect-square rounded-2xl border-4 border-[#964FFF] overflow-hidden"
                >
                  {user.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt={user.displayName}
                      fill
                      className="object-cover scale-95 rounded-2xl "
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl text-black/30">
                        {user.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`flex justify-end pb-1 h-full py-2 px-3 rounded-2xl w-[200px] bg-[#964FFF] flex-col ${spaceGrotesk.className}`}>
                  <span className="font-semibold text-white text-xl">{user.displayName}</span>
                  {user.username && (
                    <span className="text-sm text-white/80 -mt-1 font-medium">@{user.username}</span>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bg-[#964FFF] rounded-2xl p-2 w-[100px] aspect-square h-full flex items-center justify-center">
            <div className="flex w-10 h-10 rounded-full bg-white p-1">

            </div>
          </div>
        </div>
    </div>
  )
}

export default Navbar
