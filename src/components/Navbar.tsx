import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-aubergine border-b border-pink/30 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gold to-pink flex items-center justify-center">
            <span className="text-white font-display font-bold text-lg leading-none">ส</span>
          </div>
          <span className="font-display font-bold text-xl text-white">เสียงอยู่ไส Contest</span>
        </Link>
        <div className="flex gap-4">
          <Link href="/results" className="text-cyan hover:text-gold transition-colors font-medium">
            ผลคะแนน
          </Link>
        </div>
      </div>
    </nav>
  );
}
