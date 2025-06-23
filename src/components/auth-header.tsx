import Image from 'next/image';
import Link from 'next/link';
import { Button } from './ui/button';

export function AuthHeader() {
  return (
    <div className="w-full max-w-lg mx-auto bg-white/10 border-2 border-white/20 rounded-2xl shadow-lg backdrop-blur-md text-white p-4 text-center font-headline text-4xl letter-spacing-wide flex justify-between items-center">
      <Button variant="ghost" size="icon" className="bg-transparent hover:bg-white/10" asChild>
        <Link href="https://www.tiktok.com/" target="_blank">
            <Image
              src="https://static.vecteezy.com/system/resources/thumbnails/042/127/114/small/app-icon-style-tiktok-logo-with-thick-white-border-on-a-transparent-background-free-png.png"
              alt="TikTok"
              width={40}
              height={40}
              className="rounded-lg object-cover"
            />
        </Link>
      </Button>
      <h1 className="font-headline text-3xl md:text-4xl tracking-wider">Chat Family</h1>
      <Button variant="ghost" size="icon" className="bg-transparent hover:bg-white/10" asChild>
        <Link href="https://www.instagram.com/" target="_blank">
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/600px-Instagram_icon.png"
            alt="Instagram"
            width={32}
            height={32}
            className="rounded-lg"
          />
        </Link>
      </Button>
    </div>
  );
}
