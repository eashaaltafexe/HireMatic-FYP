import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="space-y-16">
      {/* Contact Hero */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
            <p className="text-xl text-gray-600 mb-8">
              Have questions about our services? We're here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info & Form */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Get in Touch</h2>
              
              <div className="space-y-8">
                <div className="flex items-start">
                  <div className="mr-4 bg-blue-100 rounded-full p-3 text-blue-600">
                    {/* Email icon placeholder */}
                    <span className="text-xl">✉️</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Email Us</h3>
                    <p className="text-gray-600 mb-2">Our friendly team is here to help.</p>
                    <a href="mailto:info@hirematic.com" className="text-blue-600 hover:underline">
                      info@hirematic.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 bg-blue-100 rounded-full p-3 text-blue-600">
                    {/* Phone icon placeholder */}
                    <span className="text-xl">📞</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Call Us</h3>
                    <p className="text-gray-600 mb-2">Mon-Fri from 8am to 5pm.</p>
                    <a href="tel:+11234567890" className="text-blue-600 hover:underline">
                      +1 (123) 456-7890
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="mr-4 bg-blue-100 rounded-full p-3 text-blue-600">
                    {/* Office icon placeholder */}
                    <span className="text-xl">🏢</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Visit Us</h3>
                    <p className="text-gray-600 mb-2">Come say hello at our office.</p>
                    <address className="not-italic text-blue-600">
                      123 Business Ave, Suite 100<br />
                      San Francisco, CA 94107
                    </address>
                  </div>
                </div>
              </div>
              
              <div className="mt-12">
                <h2 className="text-2xl font-semibold mb-6">Follow Us</h2>
                <div className="flex space-x-4">
                  <a href="#" className="bg-gray-100 hover:bg-gray-200 transition-colors p-3 rounded-full">
                    <span className="text-xl">🐦</span>
                  </a>
                  <a href="#" className="bg-gray-100 hover:bg-gray-200 transition-colors p-3 rounded-full">
                    <span className="text-xl">👨‍💼</span>
                  </a>
                  <a href="#" className="bg-gray-100 hover:bg-gray-200 transition-colors p-3 rounded-full">
                    <span className="text-xl">📷</span>
                  </a>
                  <a href="#" className="bg-gray-100 hover:bg-gray-200 transition-colors p-3 rounded-full">
                    <span className="text-xl">📺</span>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="demo">Request a Demo</option>
                    <option value="pricing">Pricing Information</option>
                    <option value="support">Technical Support</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    required
                  ></textarea>
                </div>
                
                <div className="flex items-start">
                  <input
                    id="privacy"
                    name="privacy"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    required
                  />
                  <label htmlFor="privacy" className="ml-2 block text-sm text-gray-700">
                    I agree to the{" "}
                    <Link href="/privacy-policy" className="text-blue-600 hover:underline">
                      privacy policy
                    </Link>
                  </label>
                </div>
                
                <div>
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Send Message
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden">
              {/* Replace with actual map */}
              <div className="w-full h-96 bg-gray-200 flex items-center justify-center text-gray-500 text-xl">
                Map View (Replace with actual map integration)
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center text-black">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-black">How soon can I get started with HireMatic?</h3>
                <p className="text-gray-600">
                  You can get started immediately after signing up. Our standard plans offer instant access to the platform, and our team will reach out within 24 hours to help with onboarding.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-black">Do you offer custom integrations with other HR systems?</h3>
                <p className="text-gray-600">
                  Yes, we offer custom integrations with most popular HR and ATS systems. Our team will work with you to ensure smooth data flow between your existing tools and HireMatic.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-black">Is there a limit to how many team members can use the platform?</h3>
                <p className="text-gray-600">
                  No, there's no strict limit. Our pricing is based on your organization's needs, and we can accommodate teams of any size.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-3 text-black">Can I upgrade or downgrade my plan later?</h3>
                <p className="text-gray-600">
                  Yes, you can change your plan at any time. Changes will be reflected in your next billing cycle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 