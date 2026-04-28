import { motion } from "framer-motion";

interface FeatureCardProps {
    number: string;
    title: string;
    description: string;
    index: number;
    tag: string;
    span?: "normal" | "wide" | "tall";
}

const FeatureCard = ({ number, title, description, index, tag, span = "normal" }: FeatureCardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.05 }}
            className={`group relative border border-white/5 bg-[#0d0d0d] hover:bg-[#111] transition-all duration-500 h-full flex flex-col`}
        >
            <div className="relative p-8 md:p-10 flex flex-col h-full">
                <div className="flex items-center justify-between mb-12">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/30 group-hover:text-white/60 transition-colors">
                        {number}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/20 border border-white/10 px-2 py-1 rounded-sm group-hover:border-white/30 group-hover:text-white/60 transition-all">
                        {tag}
                    </span>
                </div>

                <div className="flex-1">
                    <h3 className="font-orbitron text-[30px] font-bold text-white mb-6 tracking-tight group-hover:translate-x-1 transition-transform duration-500">
                        {title}
                    </h3>

                    <p className="text-white/40 leading-relaxed text-sm md:text-base font-light group-hover:text-white/60 transition-colors duration-500">
                        {description}
                    </p>
                </div>

                <div className="mt-12">
                    <div className="h-[1px] w-full bg-white/10 mb-6 group-hover:bg-white/20 transition-colors" />
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/30 group-hover:text-white transition-colors">
                            Read more
                        </span>
                        <span className="text-white/20 group-hover:text-white transition-all duration-500 group-hover:translate-x-1">
                            →
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};


export default FeatureCard;
