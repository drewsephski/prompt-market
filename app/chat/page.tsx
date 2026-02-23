"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { chatWithAI } from "@/app/ai-actions";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

interface Message {
    id: string;
    role: "system" | "user" | "assistant";
    content: string;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Check for prompt in URL search params
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const promptParam = params.get("prompt");

        if (promptParam) {
            try {
                const decodedPrompt = decodeURIComponent(promptParam);
                setSystemPrompt(decodedPrompt);

                // Add system prompt message to chat
                setMessages([
                    {
                        id: "system-1",
                        role: "system",
                        content: decodedPrompt,
                    },
                ]);
            } catch (error) {
                console.error("Error decoding prompt:", error);
            }
        }
    }, []);

    // Scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !systemPrompt) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const aiResponse = await chatWithAI(systemPrompt, userMessage.content);
            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: aiResponse,
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: "Sorry, I encountered an error while processing your request. Please try again.",
            };

            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100">
            {/* Atmospheric background layers */}
            <div
                className="pointer-events-none fixed inset-0 opacity-[0.025]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Gradient orbs - asymmetric composition */}
            <div className="pointer-events-none fixed -right-64 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-b from-indigo-600/8 via-purple-500/5 to-transparent blur-3xl" />
            <div className="pointer-events-none fixed -left-32 bottom-0 h-[400px] w-[400px] rounded-full bg-gradient-to-t from-emerald-600/6 to-transparent blur-3xl" />

            {/* Grid pattern overlay */}
            <div
                className="pointer-events-none fixed inset-0 opacity-[0.015]"
                style={{
                    backgroundImage: `
                        linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
                    `,
                    backgroundSize: "64px 64px",
                }}
            />

            <main className="relative mx-auto max-w-5xl px-6 py-12 lg:py-16">
                {/* Navigation */}
                <nav className="mb-12 flex items-center justify-between">
                    <Link
                        href="/prompts"
                        className="group flex items-center gap-2 font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400"
                    >
                        <span className="transition-transform group-hover:-translate-x-1">←</span>
                        <span>BACK TO LIBRARY</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-xs text-neutral-600">
                            {messages.length} {messages.length === 1 ? "message" : "messages"}
                        </span>
                    </div>
                </nav>

                {/* Header */}
                <header className="mb-12">
                    <div className="flex items-start gap-6">
                        <div className="flex-shrink-0 w-12 h-12 border border-neutral-800 bg-neutral-900/50 flex items-center justify-center">
                            <span className="text-emerald-400 text-xl">◈</span>
                        </div>
                        <div>
                            <h1 className="font-serif text-4xl font-light text-white lg:text-5xl tracking-tight">
                                Chat Interface
                            </h1>
                            <p className="mt-3 font-mono text-sm text-neutral-500">
                                Test prompts with AI • Markdown supported
                            </p>
                        </div>
                    </div>
                </header>

                {/* System Prompt Display */}
                {systemPrompt && (
                    <div className="mb-8 relative">
                        <div className="absolute -left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500/50 via-emerald-500/20 to-transparent" />
                        <div className="bg-neutral-900/40 border border-neutral-800/80 backdrop-blur-sm p-6 rounded-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-emerald-400 text-xs">⚡</span>
                                <h2 className="font-mono text-xs tracking-widest text-emerald-400">
                                    SYSTEM PROMPT
                                </h2>
                            </div>
                            <MarkdownRenderer content={systemPrompt} />
                        </div>
                    </div>
                )}

                {/* Chat Messages Container */}
                <div className="mb-8 border border-neutral-800/60 bg-neutral-900/20 backdrop-blur-sm rounded-sm overflow-hidden">
                    {/* Messages header */}
                    <div className="border-b border-neutral-800/60 px-6 py-3 flex items-center justify-between bg-neutral-900/30">
                        <span className="font-mono text-xs text-neutral-500">CONVERSATION</span>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse" />
                            <span className="font-mono text-xs text-neutral-600">Live</span>
                        </div>
                    </div>

                    {/* Messages area */}
                    <div className="min-h-[400px] max-h-[500px] overflow-y-auto p-6 space-y-6">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 border border-neutral-800 bg-neutral-900/50 flex items-center justify-center mb-6">
                                    <span className="text-neutral-600 text-2xl">◇</span>
                                </div>
                                <p className="font-mono text-sm text-neutral-500 max-w-sm">
                                    No messages yet. Start a conversation or add a prompt from the library.
                                </p>
                                <Link
                                    href="/prompts"
                                    className="mt-6 font-mono text-xs text-emerald-400 border border-emerald-500/30 px-4 py-2 hover:bg-emerald-500/10 transition-colors"
                                >
                                    BROWSE PROMPTS →
                                </Link>
                            </div>
                        ) : (
                            messages.filter(m => m.role !== "system").map((msg, index) => (
                                <div
                                    key={msg.id}
                                    className={`group relative ${msg.role === "user" ? "ml-8" : "mr-8"}`}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    {/* Role indicator */}
                                    <div className={`absolute -left-4 top-0 flex items-center gap-2 ${msg.role === "user" ? "flex-row-reverse -left-auto -right-4" : ""}`}>
                                        <div className={`w-2 h-2 rounded-full ${msg.role === "user" ? "bg-purple-500/60" : "bg-emerald-500/60"}`} />
                                    </div>

                                    {/* Message bubble */}
                                    <div
                                        className={`relative p-5 rounded-sm border transition-all duration-200 ${
                                            msg.role === "user"
                                                ? "bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40"
                                                : "bg-neutral-900/50 border-neutral-800 hover:border-neutral-700"
                                        }`}
                                    >
                                        {/* Role label */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className={`font-mono text-[10px] tracking-widest ${msg.role === "user" ? "text-purple-400" : "text-emerald-400"}`}>
                                                {msg.role === "user" ? "YOU" : "ASSISTANT"}
                                            </span>
                                            <div className="flex-1 h-px bg-neutral-800/50" />
                                        </div>

                                        {/* Content with markdown */}
                                        <MarkdownRenderer content={msg.content} />
                                    </div>
                                </div>
                            ))
                        )}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="mr-8 p-5 bg-neutral-900/50 border border-neutral-800 rounded-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="font-mono text-[10px] tracking-widest text-emerald-400">
                                        ASSISTANT
                                    </span>
                                    <div className="flex-1 h-px bg-neutral-800/50" />
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    <span className="ml-3 font-mono text-xs text-neutral-500">Generating response...</span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="relative">
                    {/* Decorative corner elements */}
                    <div className="absolute -top-px left-0 w-8 h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
                    <div className="absolute -top-px right-0 w-8 h-px bg-gradient-to-l from-emerald-500/50 to-transparent" />

                    <div className="border border-neutral-800/60 bg-neutral-900/30 backdrop-blur-sm p-6 rounded-sm">
                        <div className="flex gap-4">
                            <div className="flex-1 relative">
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your message... (Markdown supported)"
                                    className="w-full bg-neutral-900/50 border border-neutral-800 rounded-sm p-4 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-none transition-all"
                                    rows={4}
                                    disabled={isLoading}
                                />
                                <div className="absolute bottom-3 right-3 flex items-center gap-2 text-neutral-600">
                                    <span className="font-mono text-[10px]">⌘ + Enter to send</span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={handleSend}
                                    disabled={!input.trim() || !systemPrompt || isLoading}
                                    className="relative px-6 py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-sm hover:bg-emerald-500/20 hover:border-emerald-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all group overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {isLoading ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                                <span>SENDING</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="transition-transform group-hover:translate-x-0.5">→</span>
                                                <span>SEND</span>
                                            </>
                                        )}
                                    </span>
                                </button>
                                {!systemPrompt && (
                                    <span className="font-mono text-[10px] text-amber-500/80 text-center">
                                        No prompt loaded
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="mt-12 pt-8 border-t border-neutral-800/50">
                    <div className="flex items-center justify-between">
                        <p className="font-mono text-xs text-neutral-600">
                            Powered by AI • Markdown rendering enabled
                        </p>
                        <div className="flex items-center gap-4">
                            <span className="font-mono text-[10px] text-neutral-700">
                                GFM • SYNTAX HIGHLIGHTING
                            </span>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
}
