import Image from 'next/image';
export default function Logo({className='' }:{className?:string}){return <div className={`flex items-center gap-2 ${className}`}><Image src="/favicon.png" alt="KRYVEN ERA" width={34} height={34} className="h-8 w-8 object-contain"/><span className="font-display tracking-[.18em] text-chrome2">KRYVEN ERA</span></div>}
