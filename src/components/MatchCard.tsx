import Image from 'next/image'
import React from 'react'

const MatchCard = () => {
    return (
        <div className='w-full flex h-full bg-white rounded-3xl border-8 border-[#8D50F9]'>

            <div className="w-[45%] h-full"></div>
            <div className="flex flex-col h-full justify-center w-[55%]">
                <div className="rounded-2xl h-[98%] w-[99%] bg-[#8D50F9]"
                >
                    <Image
                        src="/images/1.jpg"
                        alt="Profile Picture"
                        width={200}
                        height={200}
                        className="rounded-full"
                    />
                </div>
            </div>

        </div>
    )
}

export default MatchCard
