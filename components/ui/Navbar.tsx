import { motion } from "framer-motion";
import Link from "next/link";

const Navbar = () => {
    return (
        <motion.nav
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/20 backdrop-blur-2xl"
        >
            <div className="w-full px-10 md:px-20 py-6 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4">
                    <div className="h-6 w-6 bg-white flex items-center justify-center">
                        <div className="h-1.5 w-1.5 bg-black" />
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="font-display font-black text-lg tracking-tighter text-white">RUDRANEX</span>
                        <span className="font-serif text-lg text-white/40 italic">ai</span>
                    </div>
                </Link>
                
                <div className="hidden md:flex items-center gap-12 text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 absolute left-1/2 -translate-x-1/2">
                    <a href="/#features" className="hover:text-white transition-colors duration-300">01 — Features</a>
                    <Link href="/pricing" className="hover:text-white transition-colors duration-300">02 — Pricing</Link>
                    <a href="/#manifesto" className="hover:text-white transition-colors duration-300">03 — Manifesto</a>
                    <a href="/#cta" className="hover:text-white transition-colors duration-300">04 — Access</a>
                </div>

                <Link href="/chat" className="px-6 py-2.5 bg-white text-black text-[10px] font-mono uppercase tracking-widest font-bold hover:bg-white/90 transition-all active:scale-95">
                    Launch →
                </Link>
            </div>


        </motion.nav>

    );
};

export default Navbar;
