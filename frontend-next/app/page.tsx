'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AI Learning Buddy
          </h1>
          <p className="text-xl text-gray-600">
            Your personal AI companion for mastering AI literacy in education
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Available Courses</h2>
            
            <div className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/courses/ai-literacy-basics')}>
              <h3 className="text-xl font-semibold mb-2">AI Literacy for Educators</h3>
              <p className="text-gray-600 mb-4">
                A comprehensive introduction to artificial intelligence for K-12 teachers
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>📚 3 Modules</span>
                <span>⏱️ 6 weeks</span>
                <span>🎯 Beginner</span>
              </div>
              <button className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Start Learning →
              </button>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <p className="text-gray-700">
              💡 <strong>Tip:</strong> Your AI Learning Buddy will be available throughout the course to answer questions and provide personalized help!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}