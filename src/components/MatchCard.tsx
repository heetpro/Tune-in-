import { hankenGrotesk, spaceGrotesk } from '@/app/fonts'
import { BottleWine, Check, Cigarette, DiameterIcon, Disc, Dumbbell, MoveDown, MoveLeft, MoveRight, MoveUp, PersonStanding, Play, Search, SquarePlay, Star, VenetianMask, Waypoints, X } from 'lucide-react'
import Image from 'next/image'
import React from 'react'

const MatchCard = () => {
    return (
        <div className={`w-full flex h-full bg-[#2a2a2a] rounded-3xl   ${hankenGrotesk.className}`}>

            <div className="w-[40%] h-full flex flex-col justify-between"
                style={{
                    padding: "clamp(1rem,1.25vw,100rem)"

                }}
            >
                <div className="flex flex-col ">
                    <div className="flex flex-col gap-0.5">
                        <div
                            style={{
                                fontSize: "clamp(1rem,2vw,100rem)"
                            }}
                            className={`flex text-white 
                            
                            `}>Khushi {","}19</div>
                        {/* ${spaceGrotesk.className} */}

                        <div
                            style={{
                                fontSize: "clamp(1rem,1vw,100rem)"
                            }}
                            className={`flex text-white/80 w-[90%] font-normal `}>Not here for perfect love ✨ just real vibes and pizza with extra cheese.. 🍕🍔😋 just looking for good vibes, good chats 💭 and maybe great coffee... 🧋🎀</div>
                    </div>

                    {/* tags */}
                    <div className=" gap-1.5 flex flex-wrap"
                        style={{
                            marginTop: "clamp(1rem,3vw,100rem)"

                        }}
                    >
                        <div className="text-black w-fit flex gap-0.5 items-center font-semibold bg-[#C2F949] px-2 py-0.5 rounded-3xl"><DiameterIcon size={15} />
                            <span>
                                156 cm
                            </span>
                        </div>

                        <div className="text-black w-fit flex gap-0.5 items-center font-semibold bg-[#C2F949] px-2 py-0.5 rounded-3xl"><Dumbbell size={15} />
                            <span>
                                Sometimes
                            </span>
                        </div>


                        <div className="text-black w-fit flex gap-0.5 items-center font-semibold bg-[#C2F949] px-2 py-0.5 rounded-3xl"><BottleWine size={15} />
                            <span>
                                Never
                            </span>
                        </div>

                        <div className="text-black w-fit flex gap-0.5 items-center font-semibold bg-[#C2F949] px-2 py-0.5 rounded-3xl"><Cigarette size={15} />
                            <span>
                                Never
                            </span>
                        </div>


                        <div className="text-black w-fit flex gap-0.5 items-center font-semibold bg-[#C2F949] px-2 py-0.5 rounded-3xl"><PersonStanding size={15} />
                            <span>
                                Female
                            </span>
                        </div>

                        <div className="text-black w-fit flex gap-0.5 items-center font-semibold bg-[#C2F949] px-2 py-0.5 rounded-3xl"><Search size={15} />
                            <span>
                                Something casual
                            </span>
                        </div>

                        <div className="text-black w-fit flex gap-0.5 items-center font-semibold bg-[#C2F949] px-2 py-0.5 rounded-3xl"><Waypoints size={15} />
                            <span>
                                Virgo
                            </span>
                        </div>


                        <div className="text-black w-fit flex gap-0.5 items-center font-semibold bg-[#C2F949] px-2 py-0.5 rounded-3xl"><VenetianMask size={15} />
                            <span>
                                Hindu
                            </span>
                        </div>


                    </div>
                    <div className="flex w-fit gap-3"
                        style={{
                            marginTop: "clamp(1rem,3vw,100rem)"

                        }}
                    >

                        <Disc color='white' size={40} />
                        <div className="flex">

                            <Image
                            alt='audio'
                            width={100}
                            height={100}
                            className='h-10 w-auto'
                            src={'/audio.svg'}
                            />
                        </div>
                    </div>

                </div>



                <div className="flex w-full justify-between">
                    <div className="flex gap-1">
                        <div className="w-14 h-14 flex items-center justify-center rounded-2xl aspect-square bg-[#ff3636]">
                            <X color='black' size={30} />
                        </div>
                        <div className="w-14 h-14 flex items-center justify-center rounded-2xl aspect-square bg-[#ffdd1f]">
                            <Star color='#2a2a2a' fill='#2a2a2a' size={30} />
                        </div>

                        <div className="w-14 h-14 flex items-center justify-center rounded-2xl aspect-square bg-[#C2F949]">
                            <Check color='black' size={30} />
                        </div>
                    </div>

                    <div className="flex gap-1 items-end">

                        <div className="w-10 h-10 flex items-center justify-center rounded-xl aspect-square bg-[#8D50F9]">
                            <MoveLeft color='white' size={20} />
                        </div>

                        <div className="w-10 h-10 flex items-center justify-center rounded-xl aspect-square bg-[#8D50F9]">
                            <MoveUp color='white' size={20} />
                        </div>

                        <div className="w-10 h-10 flex items-center justify-center rounded-xl aspect-square bg-[#8D50F9]">
                            <MoveDown color='white' size={20} />
                        </div>

                        <div className="w-10 h-10 flex items-center justify-center rounded-xl aspect-square bg-[#8D50F9]">
                            <MoveRight color='white' size={20} />
                        </div>



                    </div>


                </div>


            </div>
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

                    <div className="absolute top-2/3 -translate-1/2 w-[35%] flex flex-col justify-center items-center">

                        <div className="grid gap-3 grid-cols-3 bg-[#2a2a2a] w-fit rounded-4xl"
                            style={{
                                padding: "clamp(0.75rem,0.5vw,100rem)",
                            }}
                        >
                            <div className="aspect-square relative w-[100%] h-auto rounded-4xl bg-[#6e6e6e]"
                                style={{
                                    // width: "clamp(1rem,12vw,100rem)",
                                    // height: "clamp(1rem,12vw,100rem)",
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
                                        width: "clamp(1rem,1.75vw,100rem)",
                                        height: "clamp(1rem,1.75vw,100rem)",
                                    }}
                                >
                                </div>
                            </div>





                            <div className="aspect-square relative w-[100%] h-auto  rounded-4xl bg-[#6e6e6e]"
                            // style={{
                            //     width: "clamp(1rem,12vw,100rem)",
                            //     height: "clamp(1rem,12vw,100rem)",
                            // }}
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
                                        width: "clamp(1rem,1.75vw,100rem)",
                                        height: "clamp(1rem,1.75vw,100rem)",
                                    }}
                                >
                                </div>
                            </div>







                            <div className="aspect-square relative w-[100%] h-auto  rounded-4xl bg-[#6e6e6e]"
                            // style={{
                            //     width: "clamp(1rem,12vw,100rem)",
                            //     height: "clamp(1rem,12vw,100rem)",
                            // }}
                            >
                                <Image
                                    src="https://i.scdn.co/image/ab6761610000e5eb399444ed4eace08b549d1161"
                                    alt="Profile Picture"
                                    width={200}
                                    height={200}
                                    className="object-cover rounded-3xl w-full h-full"
                                />
                                <div className="flex absolute top-[5%] right-[5%] border-4 border-[#2a2a2a]p-1 cursor-pointer    bg-[#8D50F9] rounded-full"
                                    style={{
                                        width: "clamp(1rem,1.75vw,100rem)",
                                        height: "clamp(1rem,1.75vw,100rem)",
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
