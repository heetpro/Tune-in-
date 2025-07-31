import Image from 'next/image'
import React from 'react'

const MatchCard = () => {
    return (
        <div className='w-full flex h-full bg-[#2a2a2a] rounded-3xl '>

            <div className="w-[40%] h-full"></div>
            <div className="flex flex-col h-full justify-center w-[60%]">
                <div className="rounded-2xl h-[100%]  w-[99%] "
                >
                    <div className="relative w-full h-full">
                        <Image
                            src="/w3.webp"
                            alt="Profile Picture"
                            width={200}
                            height={200}
                            className="object-cover rounded-3xl w-full h-full"

                        />
                    </div>

                    <div className="absolute top-2/3 -translate-1/2 flex flex-col justify-center items-center">
                        {/* <div className="w-20 h-20 rounded-full">
                        </div> */}

                        <div className="flex gap-3 bg-[#2a2a2a] rounded-4xl"
                        style={{
                                padding: "clamp(0.75rem,0.75vw,100rem)",
                        }}
                        >
                            <div className="aspect-square relative w-48 h-48 rounded-4xl bg-[#6e6e6e]"
                            style={{
                                width: "clamp(1rem,12vw,100rem)",
                                height: "clamp(1rem,12vw,100rem)",
                            }}
                            >
                                <Image
                                    src="https://i.scdn.co/image/ab67616d0000b27383141000ee8ce3b893a0b425"
                                    alt="Profile Picture"
                                    width={200}
                                    height={200}
                                    className="object-cover rounded-3xl w-full h-full"
                                />
                                <div className="flex absolute top-[5%] right-[5%] border-4 border-[#2a2a2a]p-1 cursor-pointer bg-[#F46D38]  rounded-full"
                                style={{
                                    width: "clamp(1rem,2vw,100rem)",
                                    height: "clamp(1rem,2vw,100rem)",
                                }}
                                >
                                </div>
                            </div>





                            <div className="aspect-square relative w-48 h-48 rounded-4xl bg-[#6e6e6e]"
                            style={{
                                width: "clamp(1rem,12vw,100rem)",
                                height: "clamp(1rem,12vw,100rem)",
                            }}
                            >
                                <Image
                                    src="https://i.scdn.co/image/ab67616d0000b273a048415db06a5b6fa7ec4e1a"
                                    alt="Profile Picture"
                                    width={200}
                                    height={200}
                                    className="object-cover rounded-3xl w-full h-full"
                                />
                                <div className="flex absolute top-[5%] right-[5%] border-4 border-[#2a2a2a]p-1 cursor-pointer bg-[#C2F949] rounded-full"
                                style={{
                                    width: "clamp(1rem,2vw,100rem)",
                                    height: "clamp(1rem,2vw,100rem)",
                                }}
                                >
                                </div>
                            </div>







                            <div className="aspect-square relative w-48 h-48 rounded-4xl bg-[#6e6e6e]"
                            style={{
                                width: "clamp(1rem,12vw,100rem)",
                                height: "clamp(1rem,12vw,100rem)",
                            }}
                            >
                                <Image
                                    src="https://i.scdn.co/image/ab6761610000e5eba00b11c129b27a88fc72f36b"
                                    alt="Profile Picture"
                                    width={200}
                                    height={200}
                                    className="object-cover rounded-3xl w-full h-full"
                                />
                                <div className="flex absolute top-[5%] right-[5%] border-4 border-[#2a2a2a]p-1 cursor-pointer    bg-[#8D50F9] rounded-full"
                                style={{
                                    width: "clamp(1rem,2vw,100rem)",
                                    height: "clamp(1rem,2vw,100rem)",
                                }}
                                >
                                </div>
                            </div>

                        </div>
                    </div>
                </div>




            </div>

        </div>
    )
}

export default MatchCard
