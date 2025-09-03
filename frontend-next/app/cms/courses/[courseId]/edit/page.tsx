'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import CourseEditor from '@/components/cms/CourseEditor';
import AppLayout from '@/components/AppLayout';

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    
    if (!token || !storedUserId) {
      router.push('/auth');
      return;
    }

    setUserToken(token);
    setUserId(storedUserId);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </AppLayout>
    );
  }

  if (!userToken || !userId) {
    return null;
  }

  return (
    <AppLayout>
      <CourseEditor courseId={courseId} userToken={userToken} />
    </AppLayout>
  );
}
