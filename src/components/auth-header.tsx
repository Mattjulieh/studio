import Image from 'next/image';
import Link from 'next/link';

export function AuthHeader() {
  return (
    <header className="w-full max-w-5xl py-4 px-6 flex items-center justify-between">
      <h1 className="font-headline text-3xl md:text-4xl tracking-wider text-white">
        Chat Family
      </h1>
      <div className="flex items-center gap-4 md:gap-6">
        <Link href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png"
            alt="Instagram"
            width={28}
            height={28}
            className="rounded-lg"
          />
        </Link>
        <Link href="https://www.snapchat.com/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
          <Image
            src="https://cdn-icons-png.flaticon.com/512/1384/1384050.png"
            alt="Snapchat"
            width={28}
            height={28}
          />
        </Link>
        <Link href="https://www.whatsapp.com/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/2042px-WhatsApp.svg.png"
            alt="WhatsApp"
            width={28}
            height={28}
          />
        </Link>
        <Link href="https://www.tiktok.com/" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
          <Image
            src="https://cdn.pixabay.com/photo/2021/06/15/12/28/tiktok-6338432_1280.png"
            alt="TikTok"
            width={28}
            height={28}
          />
        </Link>
      </div>
    </header>
  );
}
