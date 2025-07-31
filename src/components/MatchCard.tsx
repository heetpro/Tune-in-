import Image from 'next/image'
import React from 'react'

const MatchCard = () => {
    return (
        <div className='w-full flex h-full bg-[#2a2a2a] rounded-3xl '>

            <div className="w-[45%] h-full"></div>
            <div className="flex flex-col h-full justify-center w-[55%]">
                <div className="rounded-2xl h-[98%] w-[99%] "
                >
                    <Image
                        src="/w2.webp"
                        alt="Profile Picture"
                        width={200}
                        height={200}
                        className="object-cover rounded-3xl w-full h-full"
                    />
                </div>
            </div>

        </div>
    )
}

export default MatchCard
