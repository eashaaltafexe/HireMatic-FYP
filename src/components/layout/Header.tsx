"use client"

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [activeLink, setActiveLink] = useState('features');

  const scrollToSection = (sectionId: string) => {
    setActiveLink(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="w-full py-4 bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold flex items-center">
          <span className="mr-2">⎈</span> HireMatic<span className="text-yellow-400">.</span>
        </Link>
        <nav>
          <ul className="flex space-x-6 items-center">
            <li>
              <button 
                onClick={() => scrollToSection('features')}
                className={`hover:text-yellow-400 transition-colors ${activeLink === 'features' ? 'text-yellow-400' : ''}`}
              >
                Features
              </button>
            </li>
            <li>
              <button 
                onClick={() => scrollToSection('how-it-works')}
                className={`hover:text-yellow-400 transition-colors ${activeLink === 'how-it-works' ? 'text-yellow-400' : ''}`}
              >
                How It Works
              </button>
            </li>
            <li>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className={`hover:text-yellow-400 transition-colors ${activeLink === 'testimonials' ? 'text-yellow-400' : ''}`}
              >
                Testimonials
              </button>
            </li>
            <li>
              <button 
                onClick={() => scrollToSection('faq')}
                className={`hover:text-yellow-400 transition-colors ${activeLink === 'faq' ? 'text-yellow-400' : ''}`}
              >
                FAQ
              </button>
            </li>
            <li>
              <Link href="/signup?fresh=true&logout=true" className="hover:text-yellow-400 transition-colors">
                Sign up
              </Link>
            </li>
            <li>
              <Link href="/login?fresh=true&logout=true" className="hover:text-yellow-400 transition-colors">
                Login
              </Link>
            </li>
            <li>
              <button 
                onClick={() => scrollToSection('cta')}
                className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors flex items-center"
              >
                Get Started <span className="ml-1">→</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
} 