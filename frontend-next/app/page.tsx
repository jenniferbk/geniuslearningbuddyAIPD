'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Course {
  id: string;
  title: string;
  description: string;
  status: string;
  moduleCount?: number;
  createdAt?: string;
}

export default function Home() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:3001/api/cms/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to view courses');
        }
        throw new Error('Failed to fetch courses');
      }

      const coursesData = await response.json();
      setCourses(coursesData);
    } catch (err: any) {
      console.error('Error fetching courses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-600">Loading courses...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              {error.includes('log in') && (
                <Link href="/auth" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Go to Login →
                </Link>
              )}
              <button 
                onClick={fetchCourses}
                className="ml-4 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Available Courses</h2>
              <Link 
                href="/cms" 
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Manage Courses
              </Link>
            </div>
            
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No courses available yet.</p>
                <Link 
                  href="/cms" 
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First Course →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {courses.map((course) => (
                  <div 
                    key={course.id}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/courses/${course.id}`)}
                  >
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    <p className="text-gray-600 mb-4">
                      {course.description || 'No description available'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📚 {course.moduleCount} Module{course.moduleCount !== 1 ? 's' : ''}</span>
                      <span>📊 {course.status === 'published' ? 'Published' : 'Draft'}</span>
                      <span>👤 {course.creator_name || 'Unknown'}</span>
                      {course.created_at && (
                        <span>📅 {new Date(course.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                    <button 
                      className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/courses/${course.id}`);
                      }}
                    >
                      Start Learning →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <p className="text-gray-700">
              💡 <strong>Tip:</strong> Your AI Learning Buddy will be available throughout each course to answer questions and provide personalized help!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}