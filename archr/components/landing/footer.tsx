import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="w-full bg-[#fafafa] py-12 px-6 md:px-12 font-sans border-t border-gray-100">
      <div className="max-w-6xl mx-auto">

        <div className="flex flex-col md:flex-row justify-between items-center gap-12 md:gap-8">

          <div className="flex items-center w-full max-w-md">
            <Image
              src="/Logo.png"
              alt="Archr Logo"
              width={32}
              height={32}
            />
            <a
              href="#"
              className="text-xl ml-2 font-semibold tracking-tight text-black"
            >
              Archr
            </a>
          </div>

          <div className="flex items-center">
            <ul className="flex flex-row items-center gap-6">
              <li><Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">Home</Link></li>
              <li><Link href="#pricing" className="text-gray-600 hover:text-gray-900 text-sm">Pricing</Link></li>
              <li><Link href="#integrations" className="text-gray-600 hover:text-gray-900 text-sm">Integrations</Link></li>
            </ul>
          </div>
          
        </div>
      </div>
    </footer>
  );
}