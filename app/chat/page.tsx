"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { chatWithAI } from "@/app/ai-actions";

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
            {/* Noise texture overlay */}
            <div
                className="pointer-events-none fixed inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Gradient orb */}
            <div className="pointer-events-none fixed -right-32 top-1/3 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

            <main className="relative mx-auto max-w-4xl px-6 py-24">
                {/* Back link */}
                <Link
                    href="/prompts"
                    className="mb-8 block font-mono text-xs tracking-widest text-neutral-500 transition-colors hover:text-emerald-400"
                >
                    ← BACK TO LIBRARY
                </Link>

                {/* Header */}
                <header className="mb-16 border-b border-neutral-800 pb-12">
                    <h1 className="font-serif text-5xl font-light text-white lg:text-6xl">
                        Chat Interface
                    </h1>
                    <p className="mt-6 font-mono text-sm text-neutral-400">
                        Test prompts with AI
                    </p>
                </header>

                {/* System Prompt Display */}
                {systemPrompt && (
                    <div className="mb-8 p-6 border border-neutral-800 bg-neutral-900/50 rounded-lg">
                        <h2 className="font-mono text-sm text-emerald-500 mb-4">SYSTEM PROMPT</h2>
                        <pre className="whitespace-pre-wrap font-mono text-sm text-neutral-300 overflow-x-auto">
                            {systemPrompt}
                        </pre>
                    </div>
                )}

                {/* Chat Messages */}
                <div className="mb-8 space-y-4 min-h-[400px] max-h-[600px] overflow-y-auto p-4 rounded-lg border border-neutral-800 bg-neutral-900/30">
                    {messages.length === 0 ? (
                        <div className="text-center py-16 text-neutral-500 font-mono text-sm">
                            No messages yet. Start a conversation or add a prompt from the library.
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`p-4 rounded-lg max-w-3xl ${msg.role === "user"
                                    ? "ml-auto bg-emerald-500/10 border border-emerald-500/30"
                                    : msg.role === "system"
                                        ? "bg-neutral-800/50 border border-neutral-700"
                                        : "bg-neutral-900/50 border border-neutral-800"
                                    }`}
                            >
                                <div className="font-mono text-xs text-neutral-500 mb-2">
                                    {msg.role.toUpperCase()}
                                </div>
                                <div className="whitespace-pre-wrap text-sm">
                                    {msg.content}
                                </div>
                            </div>
                        ))
                    )}

                    {isLoading && (
                        <div className="p-4 rounded-lg bg-neutral-900/50 border border-neutral-800 max-w-3xl">
                            <div className="font-mono text-xs text-neutral-500 mb-2">
                                ASSISTANT
                            </div>
                            <div className="flex gap-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-neutral-800 pt-8">
                    <div className="flex gap-4">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your message here..."
                            className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                            rows={4}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || !systemPrompt || isLoading}
                            className="px-6 py-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-sm hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                "SEND"
                            )}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
