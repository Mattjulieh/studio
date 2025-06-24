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
        <Link href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
          <Image
            src="https://static.vecteezy.com/system/resources/previews/023/986/704/original/tiktok-logo-tiktok-logo-transparent-tiktok-icon-transparent-free-free-png.png"
            alt="TikTok"
            width={32}
            height={32}
          />
        </Link>
      </div>
    </div>
  );
}
