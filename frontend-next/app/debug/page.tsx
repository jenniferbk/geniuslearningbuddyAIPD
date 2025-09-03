'use client';

import { useEffect, useState } from 'react';

export default function DebugAuth() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Get all localStorage values
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName');

    setDebugInfo({
      token: token ? `${token.substring(0, 20)}...` : 'NOT FOUND',
      userId: userId || 'NOT FOUND',
      userName: userName || 'NOT FOUND',
    });

    // Test the CMS API to see what it returns
    if (token) {
      fetch('http://localhost:3001/api/cms/courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      .then(res => res.json())
      .then(courses => {
        setDebugInfo(prev => ({
          ...prev,
          coursesFound: courses.length || 0,
          firstCourse: courses[0] || null,
        }));
      })
      .catch(err => {
        setDebugInfo(prev => ({
          ...prev,
          apiError: err.message,
        }));
      });
    }
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug Authentication & CMS</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">LocalStorage Values:</h2>
        <pre className="text-sm">{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>

      <div className="bg-blue-100 p-4 rounded mb-4">
        <h2 className="font-bold mb-2">Key Check:</h2>
        <p>✅ The pencil icon shows ONLY when:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>course.created_by === localStorage.userId</li>
          <li>You are the owner of the course</li>
        </ul>
      </div>

      <div className="bg-yellow-100 p-4 rounded">
        <h2 className="font-bold mb-2">Action Items:</h2>
        <ol className="list-decimal ml-6">
          <li>Check if userId above matches your actual user ID in database</li>
          <li>Check if firstCourse.created_by matches the userId</li>
          <li>If they don't match, the pencil won't show</li>
        </ol>
      </div>

      <button
        onClick={() => {
          console.log('Clearing localStorage...');
          localStorage.clear();
          window.location.href = '/auth';
        }}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Clear All & Re-login
      </button>
    </div>
  );
}
