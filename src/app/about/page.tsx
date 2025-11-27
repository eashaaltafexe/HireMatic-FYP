import Image from 'next/image';

export default function AboutPage() {
  return (
    <div className="space-y-16">
      {/* About Hero */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-6 text-center">About HireMatic</h1>
            <p className="text-xl text-gray-600 mb-8 text-center">
              We're on a mission to transform how companies find and hire talent.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <div className="relative h-80 md:h-96 w-full rounded-lg overflow-hidden">
                {/* Replace with actual image */}
                <div className="absolute inset-0 bg-gradient-to-r from-gray-500 to-gray-700 flex items-center justify-center text-white text-xl">
                  Our Story Image
                </div>
              </div>
            </div>
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Founded in 2020, HireMatic was born from a simple observation: the hiring process was broken. 
                  Our founders, with decades of experience in HR and technology, witnessed firsthand the inefficiencies, 
                  biases, and frustrations that plagued both companies and job seekers.
                </p>
                <p>
                  We set out to create a platform that would make hiring more efficient, more fair, and more 
                  effective for everyone involved. By combining advanced AI with intuitive design, we've built a 
                  solution that streamlines every step of the recruitment process.
                </p>
                <p>
                  Today, HireMatic serves thousands of companies worldwide, from fast-growing startups to Fortune 500 
                  enterprises, all of whom share our vision of a better way to build teams.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-6 text-black">Our Values</h2>
            <p className="text-lg text-gray-600">
              These core principles guide everything we do at HireMatic.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <div className="text-blue-600 text-3xl mb-4 mx-auto">
                {/* Icon placeholder */}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span>🤝</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-black">Fairness</h3>
              <p className="text-gray-600">
                We believe in creating equal opportunities for all candidates regardless of background, and helping companies build diverse teams.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <div className="text-blue-600 text-3xl mb-4 mx-auto">
                {/* Icon placeholder */}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span>💡</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-black">Innovation</h3>
              <p className="text-gray-600">
                We continuously push the boundaries of what's possible in recruitment technology to solve real-world hiring challenges.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm text-center">
              <div className="text-blue-600 text-3xl mb-4 mx-auto">
                {/* Icon placeholder */}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <span>🛡️</span>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-black">Trust</h3>
              <p className="text-gray-600">
                We prioritize transparency, data privacy, and ethical AI practices in all aspects of our platform and operations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-6">Our Leadership Team</h2>
            <p className="text-lg text-gray-600">
              Meet the people driving HireMatic's mission forward.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden">
                {/* Replace with actual image */}
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">
                  Profile Photo
                </div>
              </div>
              <h3 className="text-xl font-semibold">Jane Doe</h3>
              <p className="text-blue-600 mb-3">Co-Founder & CEO</p>
              <p className="text-gray-600">
                Former VP of HR at Fortune 100 company with 15+ years of experience in talent acquisition.
              </p>
            </div>
            
            {/* Team Member 2 */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden">
                {/* Replace with actual image */}
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">
                  Profile Photo
                </div>
              </div>
              <h3 className="text-xl font-semibold">John Smith</h3>
              <p className="text-blue-600 mb-3">Co-Founder & CTO</p>
              <p className="text-gray-600">
                AI researcher and former tech lead at leading AI companies, with expertise in machine learning.
              </p>
            </div>
            
            {/* Team Member 3 */}
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-4 rounded-full overflow-hidden">
                {/* Replace with actual image */}
                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center text-gray-500">
                  Profile Photo
                </div>
              </div>
              <h3 className="text-xl font-semibold">Sarah Johnson</h3>
              <p className="text-blue-600 mb-3">Chief Product Officer</p>
              <p className="text-gray-600">
                Product leader with experience building innovative HR tech solutions at multiple successful startups.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 