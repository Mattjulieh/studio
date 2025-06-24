import Image from 'next/image';
import Link from 'next/link';

export function AuthHeader() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white/10 border-2 border-white/20 rounded-2xl shadow-lg backdrop-blur-md text-white p-6 text-center">
      <h1 className="font-headline text-4xl md:text-5xl tracking-wider">
        Chat Family
      </h1>
      <div className="mt-6 flex justify-center items-center gap-8">
        <Link href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png"
            alt="Instagram"
            width={32}
            height={32}
            className="rounded-lg"
          />
        </Link>
        <Link href="https://www.snapchat.com/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
          <Image
            src="https://static.vecteezy.com/system/resources/previews/018/930/752/original/snapchat-logo-snapchat-icon-transparent-free-png.png"
            alt="Snapchat"
            width={32}
            height={32}
          />
        </Link>
        <Link href="https://www.whatsapp.com/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/2042px-WhatsApp.svg.png"
            alt="WhatsApp"
            width={32}
            height={32}
          />
        </Link>
        <Link href="https://www.twitter.com/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
           <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 1200 1227" fill="currentColor">
                <path d="M714.163 519.284L1160.89 0H1055.03L667.137 450.887L357.328 0H0L468.492 681.821L0 1226.37H105.866L515.491 750.218L842.672 1226.37H1200L714.137 519.284H714.163ZM569.165 687.828L521.697 619.934L144.011 79.6902H306.615L611.412 515.685L658.88 583.579L1055.08 1150.31H892.476L569.165 687.854V687.828Z"/>
           </svg>
        </Link>
      </div>
    </div>
  );
}