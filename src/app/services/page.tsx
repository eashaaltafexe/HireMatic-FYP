import Link from 'next/link';

export default function ServicesPage() {
  return (
    <div className="space-y-16">
      {/* Services Hero */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-6">Our Services</h1>
            <p className="text-xl text-white mb-8">
              Comprehensive recruitment solutions tailored to your business needs.
            </p>
          </div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Service 1 */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="text-blue-600 text-3xl mb-6">
                {/* Icon placeholder */}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span>🔍</span>
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-black">Candidate Sourcing</h3>
              <p className="text-gray-800 mb-6">
                Our AI-powered sourcing engine identifies qualified candidates from multiple channels, including job boards, social media, and your existing talent pool.
              </p>
              <ul className="space-y-3 text-gray-800 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Automated candidate matching based on skills and experience</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Advanced filtering and ranking algorithms</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Diversity-focused sourcing options</span>
                </li>
              </ul>
              <Link href="/contact" 
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
                Learn more →
              </Link>
            </div>

            {/* Service 2 */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="text-blue-600 text-3xl mb-6">
                {/* Icon placeholder */}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span>📊</span>
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-black">Applicant Tracking</h3>
              <p className="text-gray-800 mb-6">
                Our intuitive ATS streamlines your recruitment workflow, making it easy to manage applications, schedule interviews, and collaborate with your team.
              </p>
              <ul className="space-y-3 text-gray-800 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Customizable workflow stages</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Team collaboration tools</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Automated status updates and notifications</span>
                </li>
              </ul>
              <Link href="/contact" 
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
                Learn more →
              </Link>
            </div>

            {/* Service 3 */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="text-blue-600 text-3xl mb-6">
                {/* Icon placeholder */}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span>💬</span>
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-black">Interview Management</h3>
              <p className="text-gray-800 mb-6">
                Automate interview scheduling, conduct video interviews, and standardize your evaluation process to identify the best candidates.
              </p>
              <ul className="space-y-3 text-gray-800 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Integrated calendar scheduling</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Video interview platform</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Standardized scoring and feedback templates</span>
                </li>
              </ul>
              <Link href="/contact" 
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
                Learn more →
              </Link>
            </div>

            {/* Service 4 */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              <div className="text-blue-600 text-3xl mb-6">
                {/* Icon placeholder */}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span>📈</span>
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-black">Analytics & Reporting</h3>
              <p className="text-gray-800 mb-6">
                Gain actionable insights from comprehensive recruitment metrics and reports to optimize your hiring process.
              </p>
              <ul className="space-y-3 text-gray-800 mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Real-time recruitment dashboards</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Custom report builder</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>DEI metrics and benchmark data</span>
                </li>
              </ul>
              <Link href="/contact" 
                className="text-blue-600 font-medium hover:text-blue-800 transition-colors">
                Learn more →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-6 text-black">Pricing Plans</h2>
            <p className="text-lg text-gray-800">
              Flexible options to match your organization's size and recruitment needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-8">
                <h3 className="text-xl font-semibold mb-2 text-black">Starter</h3>
                <p className="text-gray-800 mb-6">Perfect for small businesses</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-black">$99</span>
                  <span className="text-gray-800">/month</span>
                </div>
                <ul className="space-y-3 text-gray-800 mb-8">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Up to 5 active job postings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Basic candidate sourcing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Standard ATS features</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 border-t">
                <Link href="/contact" 
                  className="block w-full py-2 px-4 bg-white border border-blue-600 text-blue-600 rounded-md text-center hover:bg-blue-50 transition-colors">
                  Get Started
                </Link>
              </div>
            </div>
            
            {/* Professional Plan */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden border-2 border-blue-600 transform scale-105">
              <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium">
                MOST POPULAR
              </div>
              <div className="p-8">
                <h3 className="text-xl font-semibold mb-2 text-black">Professional</h3>
                <p className="text-gray-800 mb-6">For growing companies</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-black">$299</span>
                  <span className="text-gray-800">/month</span>
                </div>
                <ul className="space-y-3 text-gray-800 mb-8">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Up to 15 active job postings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Advanced AI-powered sourcing</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Interview scheduling & management</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Basic analytics dashboard</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 border-t">
                <Link href="/contact" 
                  className="block w-full py-2 px-4 bg-blue-600 text-white rounded-md text-center hover:bg-blue-700 transition-colors">
                  Get Started
                </Link>
              </div>
            </div>
            
            {/* Enterprise Plan */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-8">
                <h3 className="text-xl font-semibold mb-2 text-black">Enterprise</h3>
                <p className="text-gray-800 mb-6">For large organizations</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-black">Custom</span>
                </div>
                <ul className="space-y-3 text-gray-800 mb-8">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Unlimited job postings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Premium AI sourcing & matching</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Advanced analytics & reporting</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Dedicated account manager</span>
                  </li>
                </ul>
              </div>
              <div className="p-4 bg-gray-50 border-t">
                <Link href="/contact" 
                  className="block w-full py-2 px-4 bg-white border border-blue-600 text-blue-600 rounded-md text-center hover:bg-blue-50 transition-colors">
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 