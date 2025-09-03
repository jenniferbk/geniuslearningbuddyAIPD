'use client';

import { CheckCircle, PlayCircle, FileText, BookOpen } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  type: string;
  duration: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  modules: Module[];
}

interface CourseNavProps {
  course: Course;
  currentLesson: Lesson | null;
  onLessonSelect: (lesson: Lesson) => void;
}

export default function CourseNav({ course, currentLesson, onLessonSelect }: CourseNavProps) {
  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayCircle className="w-4 h-4" />;
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'reading':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-4">
      <h2 className="font-semibold text-gray-900 mb-4">Course Content</h2>
      
      {course.modules.map((module) => (
        <div key={module.id} className="mb-6">
          <h3 className="font-medium text-gray-700 mb-2">
            Module {module.order}: {module.title}
          </h3>
          
          <div className="space-y-1">
            {module.lessons.map((lesson) => (
              <button
                key={lesson.id}
                onClick={() => onLessonSelect(lesson)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  currentLesson?.id === lesson.id
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                {getLessonIcon(lesson.type)}
                <div className="flex-1">
                  <div className="text-sm">{lesson.title}</div>
                  <div className="text-xs text-gray-500">{lesson.duration}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}