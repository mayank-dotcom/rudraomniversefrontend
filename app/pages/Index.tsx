"use client"

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import HeroScene from "@/components/ui/HeroScene";

import Navbar from "@/components/ui/Navbar";
import FeatureCard from "@/components/ui/FeatureCard";
import { ArrowRight, Bot, Cpu, Globe, Zap } from "lucide-react";

const Index = () => {


    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white selection:text-black">
            <Navbar />

            {/* Hero Section */}
            <section className="relative h-screen flex flex-col overflow-hidden">
                <div className="absolute inset-0 z-0 opacity-80">
                    <HeroScene />
                </div>

                {/* Top Metadata Bar */}
                <div className="relative z-20 pt-32 px-10 flex justify-between items-start text-[9px] font-mono uppercase tracking-[0.3em] text-white/40">
                    <div className="flex gap-10">
                        <div className="flex items-center gap-3">
                            <div className="h-1.5 w-1.5 bg-white/40 rotate-45" />
                            <span>N° 001 / Rudranex AI</span>
                        </div>
                        <span>AI - Co-pilot for student life</span>
                    </div>
                    <div className="flex gap-20">
                        <span>EST • 2026 • INDIA</span>
                        <span>Vol. I — Edition for Students</span>
                    </div>
                </div>

                <div className="flex-1 container mx-auto px-10 flex items-center z-10 relative">
                    <div className="grid grid-cols-12 w-full items-center">
                        {/* Title Section */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                            className="col-span-12 lg:col-span-8 select-none"
                        >
                            <h1 className="flex flex-col leading-[0.8] tracking-[-0.06em]">
                                <span className="flex items-baseline">
                                    <span className="text-[12rem] md:text-[16rem] font-black font-display text-white">RUDRA</span>
                                    <span className="text-[6rem] md:text-[8rem] font-serif italic text-white/80 -ml-4">nex</span>
                                </span>
                                <span className="text-[12rem] md:text-[16rem] font-black font-display text-white/10 -mt-8">AI.</span>
                            </h1>
                        </motion.div>

                        {/* Description & Buttons Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="col-span-12 lg:col-span-4 lg:pl-12 mt-12 lg:mt-0"
                        >
                            <p className="text-lg md:text-xl text-white/70 leading-snug mb-10 font-medium">
                                One quiet, precise <span className="italic font-serif text-white">intelligence</span> for your entire student life — from cracking tech interviews to mastering 100-page textbooks.
                            </p>
                            <div className="flex items-center gap-4">
                                <Link to="/chat" className="whitespace-nowrap px-8 py-4 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/90 transition-all active:scale-95 text-center">
                                    Start Free →
                                </Link>
                                <button className="whitespace-nowrap px-8 py-4 border border-white/20 bg-transparent text-white text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-white/5 transition-all active:scale-95">
                                    Watch Demo
                                </button>

                            </div>


                        </motion.div>
                    </div>
                </div>

                {/* Bottom Scrolling Bar */}
                <div className="absolute bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-black/40 backdrop-blur-md overflow-hidden">
                    <div className="flex py-4 animate-infinite-scroll whitespace-nowrap">
                        {[
                            "Students", "Privacy First", "Adaptive Practice", "PDF Intelligence", "Code Co-pilot", "Vision AI", "Career Path"
                        ].map((tag, i) => (
                            <div key={i} className="flex items-center mx-10 text-[9px] font-mono uppercase tracking-[0.3em] text-white/60">
                                <div className="h-1.5 w-1.5 bg-white/30 rotate-45 mr-4" />
                                {tag}
                            </div>
                        ))}
                        {/* Repeat for seamless scroll */}
                        {[
                            "Students", "Privacy First", "Adaptive Practice", "PDF Intelligence", "Code Co-pilot", "Vision AI", "Career Path"
                        ].map((tag, i) => (
                            <div key={i} className="flex items-center mx-10 text-[9px] font-mono uppercase tracking-[0.3em] text-white/60">
                                <div className="h-1.5 w-1.5 bg-white/30 rotate-45 mr-4" />
                                {tag}
                            </div>
                        ))}
                    </div>
                </div>
            </section>


            {/* Features Section */}
            <section id="features" className="py-32 bg-[#0a0a0a] border-t border-white/5">
                <div className="w-full">
                    {/* Header with Metadata */}
                    <div className="flex flex-col md:flex-row gap-12 mb-32 px-10 md:px-20">
                        <div className="md:w-1/3">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-[10px] font-mono tracking-[0.3em] text-white">§ 02</span>
                                <div className="h-[1px] flex-1 bg-white/20" />
                            </div>
                            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
                                Capabilities <br /> & Tools
                            </h3>
                        </div>
                        <div className="md:w-2/3">
                            <h2 className="text-5xl md:text-7xl font-display font-bold tracking-tight leading-[0.9] mb-10">
                                Eight quiet tools. <br />
                                <span className="font-serif italic font-normal text-white/80">One</span>
                                <span className="font-black"> obvious advantage.</span>
                            </h2>
                            <p className="text-white/50 text-lg md:text-xl max-w-2xl leading-relaxed">
                                A complete, monochrome toolkit — engineered to make you study smarter, prepare faster, and ship better projects.
                            </p>
                        </div>
                    </div>

                    {/* Bento Grid - 90% Width */}
                    <div className="w-[90%] mx-auto grid grid-cols-1 md:grid-cols-6 gap-px bg-white/10 border border-white/10">

                        {/* Row 1 */}
                        <div className="md:col-span-3">
                            <FeatureCard
                                number="01"
                                title="Tech Interview Simulator"
                                description="Practice live tech interviews with an AI that adapts in real time. DSA, system design, behavioural — all simulated with structured, instant feedback."
                                tag="INTERVIEW"
                                index={0}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <FeatureCard
                                number="02"
                                title="Resume Analyzer"
                                description="Upload your resume. Get pinpoint feedback — ATS score, missing keywords, role-specific rewrites."
                                tag="CAREER"
                                index={1}
                            />
                        </div>

                        {/* Row 2 */}
                        <div className="md:col-span-2">
                            <FeatureCard
                                number="03"
                                title="Career Predictor"
                                description="Discover the career paths that fit you best — backed by deep ML on skills, projects and interests."
                                tag="SILENT"
                                index={2}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FeatureCard
                                number="04"
                                title="PDF Intelligence"
                                description="Stop reading 100-page textbooks. Chat with them. Extract summaries, ask questions, find exact answers — instantly."
                                tag="READING"
                                index={3}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FeatureCard
                                number="05"
                                title="Mock Tests"
                                description="Generate adaptive MCQs from any topic, syllabus or uploaded file. Quizzes that actually adjust to you."
                                tag="PRACTICE"
                                index={4}
                            />
                        </div>

                        {/* Row 3 */}
                        <div className="md:col-span-3">
                            <FeatureCard
                                number="06"
                                title="Code & GitHub"
                                description="Paste a GitHub link. We pull the raw code and help you debug, explain, refactor or rewrite — line by line."
                                tag="ENGINEERING"
                                index={5}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <FeatureCard
                                number="07"
                                title="Vision AI & Generation"
                                description="Snap handwritten math for step-by-step solutions, or describe an idea and let AI render stunning visuals for your projects."
                                tag="VISION"
                                index={6}
                            />
                        </div>

                        {/* Row 4 */}
                        <div className="md:col-span-2">
                            <FeatureCard
                                number="08"
                                title="Personalised Learning"
                                description="Your AI study companion remembers what you struggle with — and crafts custom plans that actually move the needle."
                                tag="MEMORY"
                                index={7}
                            />
                        </div>
                        <div className="md:col-span-4 bg-[#0a0a0a]" /> {/* Spacer */}

                    </div>
                </div>
            </section>



            {/* Manifesto Section */}
            <section id="manifesto" className="py-32 bg-white text-black">
                <div className="container mx-auto px-6">
                    <div className="max-w-4xl">
                        <span className="inline-block mb-8 text-[10px] font-mono tracking-[0.2em] uppercase text-black/40">
                            Our Philosophy
                        </span>
                        <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter mb-12 leading-tight">
                            Intelligence should be <span className="italic font-serif">invisible</span> yet omnipresent.
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-lg">
                            <p className="font-medium">
                                At Rudranex, we believe the most powerful AI systems are those that integrate
                                seamlessly into the human experience. We aren't just building tools; we are
                                crafting the cognitive fabric of the next century.
                            </p>
                            <p className="text-black/60">
                                Through rigorous research and radical innovation, we are pushing the boundaries
                                of what machines can perceive, understand, and create. Our manifesto is simple:
                                excellence without compromise.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="cta" className="py-52 bg-[#0a0a0a] border-t border-white/5">

                <div className="w-full px-10 md:px-20">
                    <div className="flex flex-col md:flex-row gap-20">
                        {/* Metadata bar */}
                        <div className="md:w-1/4">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-[10px] font-mono tracking-[0.3em] text-white">§ 03</span>
                                <div className="h-[1px] flex-1 bg-white/20" />
                            </div>
                            <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
                                Global <br /> Access
                            </h3>
                        </div>

                        {/* Content */}
                        <div className="md:w-3/4 flex flex-col gap-20">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                            >
                                <h2 className="text-7xl md:text-[10rem] font-display font-black tracking-tighter leading-[0.8] text-white">
                                    Ready to <br />
                                    <span className="font-serif italic font-normal text-white/40">level up?</span>
                                </h2>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="max-w-xl"
                            >
                                <p className="text-white/60 text-lg md:text-xl leading-snug mb-12 font-light">
                                    Join thousands of students already moving faster, sharper, and quieter — with Rudranex AI.
                                </p>
                                <Link to="/chat" className="inline-block w-full md:w-auto px-12 py-6 bg-white text-black text-[10px] font-mono font-bold uppercase tracking-[0.3em] hover:bg-white/90 transition-all active:scale-95 shadow-2xl shadow-white/5 text-center">
                                    Get Started — Free →
                                </Link>

                            </motion.div>
                        </div>

                    </div>
                </div>
            </section>


            {/* Footer */}
            <footer className="py-6 border-t border-white/5">




                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
                    <div className="flex items-baseline gap-2">
                        <span className="font-display font-black text-2xl tracking-tighter text-white">RUDRANEX</span>
                        <span className="font-serif text-2xl text-muted-foreground">ai</span>
                    </div>

                    <div className="flex gap-12 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        <a href="#" className="hover:text-white transition">X / Twitter</a>
                        <a href="#" className="hover:text-white transition">LinkedIn</a>
                        <a href="#" className="hover:text-white transition">Github</a>
                    </div>

                    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/40">
                        © 2026 Rudranex AI Systems
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Index;
