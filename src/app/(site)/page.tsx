"use client"

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export default function Home() {
  const [activeLink, setActiveLink] = useState('features');
  const [openFaqItem, setOpenFaqItem] = useState<number | null>(null);

  const toggleFaqItem = (index: number) => {
    if (openFaqItem === index) {
      setOpenFaqItem(null);
    } else {
      setOpenFaqItem(index);
    }
  };

  return (
    <div className="space-y-20">
      {/* Navigation Bar */}
      <nav className="bg-[#2A3647] shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <Link href="/" className="flex items-center">
                <span className="text-2xl mr-2 text-white">⎈</span>
                <span className="text-xl font-bold text-white">HireMatic</span>
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <Link href="/#features" className="text-white hover:text-[#3B82F6] font-medium">Features</Link>
              <Link href="/#how-it-works" className="text-white hover:text-[#3B82F6] font-medium">How It Works</Link>
              <Link href="/#testimonials" className="text-white hover:text-[#3B82F6] font-medium">Testimonials</Link>
              <Link href="/#faq" className="text-white hover:text-[#3B82F6] font-medium">FAQ</Link>
              <Link href="/login" className="text-white hover:text-[#3B82F6] font-medium">Login</Link>
              <Link href="/signup" className="bg-[#3B82F6] text-white px-4 py-2 rounded-md hover:bg-opacity-90 transition">Sign Up</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-[#F9FAFB] pt-28">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-5xl font-bold mb-6 text-[#2A3647]">
                Unlock <span className="text-[#3B82F6]">doors</span> to
                <br />
                new opportunities
              </h1>
              <p className="text-lg text-gray-700 mb-8">
                Streamline your hiring process with HireMatic. Our AI-driven
                platform automates resume parsing, candidate screening, and
                interview evaluations, helping you find the perfect match faster and
                more efficiently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#2A3647] hover:bg-[#1e2a36] text-white px-6 py-3 rounded-md text-center transition-colors"
                >
                  Request Demo
                </button>
                <button
                  onClick={() => {
                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-white border border-gray-300 hover:border-[#2A3647] px-6 py-3 rounded-md text-center transition-colors"
                >
                  Learn More
                </button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="relative h-80 md:h-96 w-full">
                <div className="absolute inset-0 bg-gradient-to-br from-[#2A3647] to-[#3B82F6] rounded-xl shadow-lg overflow-hidden">
                  <div className="absolute inset-0 opacity-20">
                    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                      <path fill="#FFFFFF" d="M47.7,-57.2C59.9,-45.8,66.8,-29,68.7,-12.2C70.6,4.7,67.4,21.5,58.5,35.9C49.5,50.3,34.8,62.3,17.8,67.2C0.7,72.1,-18.7,69.9,-34.1,61.2C-49.5,52.4,-61,37,-67.8,19.2C-74.7,1.4,-77,-19,-68.8,-32.7C-60.6,-46.4,-42,-53.5,-25.7,-63C-9.4,-72.6,5.5,-84.7,21.6,-82.1C37.7,-79.5,55,-68.5,47.7,-57.2Z" transform="translate(100 100)" />
                    </svg>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                    <div className="text-3xl font-bold mb-4">HireMatic AI</div>
                    <div className="text-lg mb-6 text-center">Smart recruitment that finds the perfect match</div>
                    <div className="grid grid-cols-2 gap-4 text-sm opacity-80 w-full max-w-xs">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>AI-Powered</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>Time-Saving</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>Cost-Effective</span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                        </svg>
                        <span>Data-Driven</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#2A3647]">Intelligent Recruitment Features</h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              HireMatic leverages cutting-edge AI technology to transform your recruitment process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-[#EBF5FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">AI</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#2A3647]">Smart Resume Parsing</h3>
              <p className="text-gray-700">
                Automatically extract and analyze candidate information from resumes, saving hours of manual review.
              </p>
            </div>
            
            {/* Feature 2 - The rest of the features follow the same pattern */}
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-[#EBF5FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#2A3647]">Virtual Interviewer</h3>
              <p className="text-gray-700">
                Conduct AI-powered interviews that adapt to candidate responses and provide objective assessments.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="p-8 text-center">
              <div className="w-24 h-24 bg-[#EBF5FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-[#2A3647]">Advanced Analytics</h3>
              <p className="text-gray-700">
                Gain insights from comprehensive reports on candidate performance and recruitment metrics.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#2A3647]">How HireMatic Works</h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              A simple yet powerful workflow that transforms your recruitment process
            </p>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center mb-12 md:mb-0">
              <div className="w-20 h-20 bg-[#3B82F6] rounded-full flex items-center justify-center mb-4 text-white">
                <span className="text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#2A3647]">Post Jobs</h3>
              <p className="text-gray-700 max-w-xs">
                Create detailed job descriptions with our AI-powered system and publish across multiple channels.
              </p>
            </div>

            <div className="hidden md:block w-24 h-px bg-gray-200"></div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center mb-12 md:mb-0">
              <div className="w-20 h-20 bg-[#3B82F6] rounded-full flex items-center justify-center mb-4 text-white">
                <span className="text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#2A3647]">Screen Candidates</h3>
              <p className="text-gray-700 max-w-xs">
                Let AI parse and score resumes, identifying the best matches for your positions.
              </p>
            </div>

            <div className="hidden md:block w-24 h-px bg-gray-200"></div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center mb-12 md:mb-0">
              <div className="w-20 h-20 bg-[#3B82F6] rounded-full flex items-center justify-center mb-4 text-white">
                <span className="text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#2A3647]">Conduct Interviews</h3>
              <p className="text-gray-700 max-w-xs">
                Use our virtual interviewer to evaluate candidates consistently and objectively.
              </p>
            </div>

            <div className="hidden md:block w-24 h-px bg-gray-200"></div>
            
            {/* Step 4 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-[#3B82F6] rounded-full flex items-center justify-center mb-4 text-white">
                <span className="text-2xl font-bold">4</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-[#2A3647]">Make Decisions</h3>
              <p className="text-gray-700 max-w-xs">
                Review AI-generated reports and insights to make data-driven hiring decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 bg-[#2A3647] text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">What Our Customers Say</h2>
            <p className="text-lg max-w-3xl mx-auto opacity-80">
              Trusted by leading companies to improve their hiring process
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial 1 */}
            <div className="bg-[#1e2a36] p-8 rounded-xl shadow-lg">
              <div className="flex mb-4 text-[#3B82F6]">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="mb-6 italic">
                "HireMatic has transformed our recruitment process. We've reduced time-to-hire by 40% and improved the quality of our candidates significantly."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold">JS</span>
                </div>
              <div>
                  <div className="font-bold">Jennifer Smith</div>
                  <div className="text-sm opacity-70">HR Director, TechInnovate</div>
                </div>
              </div>
            </div>
            
            {/* Testimonial 2 */}
            <div className="bg-[#1e2a36] p-8 rounded-xl shadow-lg">
              <div className="flex mb-4 text-[#3B82F6]">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="mb-6 italic">
                "The AI-powered candidate matching is incredibly accurate. It's like having an expert recruiter working 24/7 to find the perfect candidates."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold">MR</span>
              </div>
              <div>
                  <div className="font-bold">Michael Rodriguez</div>
                  <div className="text-sm opacity-70">CEO, Growth Startup</div>
                </div>
              </div>
            </div>
            
            {/* Testimonial 3 */}
            <div className="bg-[#1e2a36] p-8 rounded-xl shadow-lg">
              <div className="flex mb-4 text-[#3B82F6]">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                ))}
              </div>
              <p className="mb-6 italic">
                "As a small business, we couldn't afford a large HR team. HireMatic has enabled us to compete with larger companies for top talent."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-[#3B82F6] rounded-full flex items-center justify-center mr-4">
                  <span className="font-bold">AL</span>
              </div>
              <div>
                  <div className="font-bold">Aisha Lee</div>
                  <div className="text-sm opacity-70">Founder, Creative Solutions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-[#F9FAFB]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-[#2A3647]">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              Get answers to common questions about HireMatic
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            {[
              {
                question: "How does HireMatic's AI improve the hiring process?",
                answer: "HireMatic uses advanced AI algorithms to analyze resumes, conduct initial screenings, and provide objective insights about candidates. This dramatically reduces time-to-hire and improves the quality of matches between candidates and positions."
              },
              {
                question: "Is HireMatic suitable for small businesses?",
                answer: "Yes! HireMatic is designed to scale with your business. We offer plans for companies of all sizes, from startups to enterprise organizations, with features that can be customized to your specific hiring needs."
              },
              {
                question: "How secure is candidate data on HireMatic?",
                answer: "We take data security extremely seriously. HireMatic employs industry-leading encryption, regular security audits, and strict access controls to protect all candidate and company information in compliance with GDPR and other privacy regulations."
              },
              {
                question: "Can HireMatic integrate with our existing HR systems?",
                answer: "Absolutely. HireMatic offers APIs and pre-built integrations with popular HRIS, ATS, and other HR platforms, ensuring a seamless workflow between all your HR systems."
              },
              {
                question: "What kind of support does HireMatic provide?",
                answer: "We offer 24/7 customer support via chat, email, and phone. Our dedicated account managers provide personalized assistance, and our knowledge base contains comprehensive guides and tutorials to help you make the most of HireMatic."
              }
            ].map((faq, index) => (
              <div key={index} className="mb-4 border-b border-gray-200 pb-4 last:border-b-0">
                <button
                  onClick={() => toggleFaqItem(index)}
                  className="flex justify-between items-center w-full text-left font-medium py-2"
                >
                  <span className="text-lg text-[#2A3647]">{faq.question}</span>
                  <svg
                    className={`w-5 h-5 transition-transform ${openFaqItem === index ? 'transform rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaqItem === index && (
                  <div className="mt-2 text-gray-700 pl-2">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="cta" className="py-16 bg-gradient-to-r from-[#2A3647] to-[#3B82F6] text-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Hiring Process?</h2>
            <p className="text-lg max-w-3xl mx-auto">
              Join hundreds of companies already using HireMatic to build stronger teams with less effort. Get started today with a free demo.
            </p>
          </div>
          
          <div className="flex justify-center">
            <a href="#" className="inline-block bg-white text-[#2A3647] font-medium px-8 py-3 rounded-md hover:bg-opacity-90 transition-colors">
              Request Demo
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#2A3647] text-white">
        <div className="container mx-auto py-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">⎈</span>
                <span className="text-xl font-bold">HireMatic</span>
              </div>
              <p className="text-sm text-gray-300 mb-4">
                Transforming recruitment with AI-powered solutions that find the perfect match between candidates and companies.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-300 hover:text-[#3B82F6]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 320 512">
                    <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-[#3B82F6]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 512 512">
                    <path d="M459.37 151.716c.325 4.548.325 9.097.325 13.645 0 138.72-105.583 298.558-298.558 298.558-59.452 0-114.68-17.219-161.137-47.106 8.447.974 16.568 1.299 25.34 1.299 49.055 0 94.213-16.568 130.274-44.832-46.132-.975-84.792-31.188-98.112-72.772 6.498.974 12.995 1.624 19.818 1.624 9.421 0 18.843-1.3 27.614-3.573-48.081-9.747-84.143-51.98-84.143-102.985v-1.299c13.969 7.797 30.214 12.67 47.431 13.319-28.264-18.843-46.781-51.005-46.781-87.391 0-19.492 5.197-37.36 14.294-52.954 51.655 63.675 129.3 105.258 216.365 109.807-1.624-7.797-2.599-15.918-2.599-24.04 0-57.828 46.782-104.934 104.934-104.934 30.213 0 57.502 12.67 76.67 33.137 23.715-4.548 46.456-13.32 66.599-25.34-7.798 24.366-24.366 44.833-46.132 57.827 21.117-2.273 41.584-8.122 60.426-16.243-14.292 20.791-32.161 39.308-52.628 54.253z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-300 hover:text-[#3B82F6]">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 448 512">
                    <path d="M100.28 448H7.4V148.9h92.88zM53.79 108.1C24.09 108.1 0 83.5 0 53.8a53.79 53.79 0 0 1 107.58 0c0 29.7-24.1 54.3-53.79 54.3zM447.9 448h-92.68V302.4c0-34.7-.7-79.2-48.29-79.2-48.29 0-55.69 37.7-55.69 76.7V448h-92.78V148.9h89.08v40.8h1.3c12.4-23.5 42.69-48.3 87.88-48.3 94 0 111.28 61.9 111.28 142.3V448z"/>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-300 hover:text-[#3B82F6]">Features</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">Pricing</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">Case Studies</a></li>
                <li><a href="#testimonials" className="text-gray-300 hover:text-[#3B82F6]">Testimonials</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">Integration</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">About Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">Careers</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">Blog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">Press</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">Documentation</a></li>
                <li><a href="#faq" className="text-gray-300 hover:text-[#3B82F6]">FAQs</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">Privacy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#3B82F6]">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-600 mt-12 pt-8 text-sm text-gray-400 text-center">
            <p>&copy; {new Date().getFullYear()} HireMatic. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 