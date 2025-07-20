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
          <div className="w-fit h-full">
            <Logo2 />
          </div>
          <div className="flex gap-2 h-full">
            {user && (
              <>
                <div className="relative h-full aspect-square rounded-2xl border-4 border-[#8D50F9] overflow-hidden"
                >
                  {user.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt={user.displayName}
                      fill
                      className="object-cover scale-95 aspect-square w-full h-full rounded-2xl "
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl text-black/30">
                        {user.displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`flex justify-end pb-1 h-full py-2 px-3 rounded-2xl w-[200px] bg-[#8D50F9] flex-col ${spaceGrotesk.className}`}>
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
        </div>
    </div>
  )
}

export default Navbar
