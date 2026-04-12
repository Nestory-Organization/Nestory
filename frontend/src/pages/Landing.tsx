import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, Zap, BarChart3, MessageCircle, Trophy, ArrowRight, Check } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">Nestory</span>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Login
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Make Reading a Family Adventure
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Nestory helps families stay connected while encouraging children to develop a love for reading. Track progress, reward achievements, and communicate with your child's reading journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-lg"
            >
              Login to Your Account
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Key Features
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Family Groups</h3>
              <p className="text-gray-600">
                Create family groups, invite children, and manage all reading activities in one place. Keep everyone connected and engaged.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Family Chat ⭐</h3>
              <p className="text-gray-600">
                Auto-generated family chat groups for real-time communication. Share updates, encouragement, and celebrate reading milestones together.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Story Library</h3>
              <p className="text-gray-600">
                Browse curated stories and assign them to children. Stories automatically appear on their dashboard, ready to read.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Progress Tracking</h3>
              <p className="text-gray-600">
                Monitor reading progress with detailed analytics. See what, when, and how much your child reads at a glance.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Trophy className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Gamification</h3>
              <p className="text-gray-600">
                Earn points, badges, and achievements. Keep children motivated and make reading fun with reward systems.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-8 border border-gray-200 rounded-xl hover:shadow-lg transition">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real-time Updates</h3>
              <p className="text-gray-600">
                Get instant notifications about reading activities, new assignments, and family interactions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            How Nestory Works
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Parent Login</h3>
              <p className="text-gray-600">
                Create your account and set up your family profile
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Create Family Group</h3>
              <p className="text-gray-600">
                Set up a family group and auto-generate a family chat
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Add Children</h3>
              <p className="text-gray-600">
                Invite children to join your family group
              </p>
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Assign & Read</h3>
              <p className="text-gray-600">
                Assign stories and track your child's reading progress
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Benefits for Your Family
          </h2>
          <div className="grid md:grid-cols-2 gap-12">
            {/* Parent Benefits */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">For Parents</h3>
              <div className="space-y-4">
                {[
                  'Monitor reading habits with detailed analytics',
                  'Stay connected with your child through family chat',
                  'Access curated stories recommended for different ages',
                  'Receive notifications about reading progress',
                  'Celebrate achievements together',
                  'Build stronger family bonds'
                ].map((benefit, idx) => (
                  <div key={idx} className="flex gap-4">
                    <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Child Benefits */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-8">For Children</h3>
              <div className="space-y-4">
                {[
                  'Develop a love for reading through engaging stories',
                  'Earn rewards and badges for reading achievements',
                  'Connect with family members in real-time',
                  'Track personal reading progress and milestones',
                  'Get motivated through gamification',
                  'Access stories wherever, whenever'
                ].map((benefit, idx) => (
                  <div key={idx} className="flex gap-4">
                    <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Start Your Family's Reading Journey Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of families making reading fun and connected.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 font-semibold text-lg flex items-center justify-center gap-2"
            >
              Create Free Account <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white hover:bg-opacity-10 font-semibold text-lg"
            >
              Already have an account?
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-6 h-6 text-blue-400" />
                <span className="text-lg font-bold text-white">Nestory</span>
              </div>
              <p className="text-sm">Making reading a family adventure</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Nestory. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
