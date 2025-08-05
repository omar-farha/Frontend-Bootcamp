"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Play, Clock, BookOpen } from "lucide-react"
import { accessCodeService, courseService } from "@/lib/database"

interface Session {
  id: string
  title: string
  description: string
  content: string
  assignment: string
  tasks: string[]
  video_url: string | null
  order_index: number
}

interface Course {
  id: string
  title: string
  description: string
  icon: string
  sessions: Session[]
}

interface CoursePageProps {
  params: {
    courseId: string
  }
}

// Helper function to validate URLs
const isValidUrl = (url: string | null | undefined): boolean => {
  if (!url) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export default function CoursePage({ params }: CoursePageProps) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const validateAccessAndFetchCourse = async () => {
      try {
        setLoading(true)

        // 1. Check if access code exists in localStorage
        const accessCode = localStorage.getItem("access_code")

        if (!accessCode) {
          console.log("No access code found")
          router.push("/")
          return
        }

        // 2. Verify the access code is valid and active
        const accessData = await accessCodeService.findByCode(accessCode)

        if (!accessData || !accessData.is_active) {
          console.error("Invalid or inactive access code")
          localStorage.removeItem("access_code")
          router.push("/")
          return
        }

        // 3. Fetch course data
        const courses = await courseService.getAll()
        const courseData = courses.find((c) => c.id === params.courseId)

        if (!courseData) {
          console.error("Course not found")
          router.push("/")
          return
        }

        // Sort sessions by order_index
        const sortedSessions = [...courseData.sessions].sort((a, b) => a.order_index - b.order_index)

        setCourse({
          ...courseData,
          sessions: sortedSessions,
        })
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Unexpected error:", error)
        router.push("/")
      } finally {
        setLoading(false)
      }
    }

    validateAccessAndFetchCourse()
  }, [params.courseId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0fd8d7] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // The router will handle the redirect
    return null
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <p>Course not found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black animate-gradient-shift"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(15,216,215,0.1),transparent_50%)] animate-pulse-slow"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800/50 backdrop-blur-sm bg-black/20">
          <div className="container mx-auto px-4 py-6">
            <Link
              href="/"
              className="text-2xl font-bold text-[#0fd8d7] hover:text-[#0bc5c4] transition-colors duration-300 animate-fade-in-up"
            >
              Frontend Academy
            </Link>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center text-[#0fd8d7] hover:text-[#0bc5c4] mb-8 transition-all duration-300 hover:transform hover:translate-x-1 animate-fade-in-up animation-delay-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Courses
          </Link>

          <div className="mb-16 animate-fade-in-up animation-delay-400">
            <div className="flex items-center mb-6">
              {course.icon.startsWith("http") ? (
                <img
                  src={course.icon || "/placeholder.svg"}
                  alt="Course icon"
                  className="w-16 h-16 mr-6 rounded-lg object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).className = "hidden"
                  }}
                />
              ) : (
                <span className="text-6xl mr-6 animate-bounce-slow">{course.icon || "📚"}</span>
              )}
              <h1 className="text-5xl font-bold bg-gradient-to-r from-[#0fd8d7] to-white bg-clip-text text-transparent">
                {course.title}
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-4xl leading-relaxed">{course.description}</p>
            <div className="flex items-center text-gray-400 bg-gray-900/50 rounded-lg px-4 py-2 w-fit backdrop-blur-sm">
              <Clock className="w-5 h-5 mr-2 text-[#0fd8d7]" />
              <span>{course.sessions.length} Sessions</span>
            </div>
          </div>

          <div className="max-w-5xl">
            <h2 className="text-3xl font-bold mb-12 animate-fade-in-up animation-delay-600">Course Sessions</h2>
            <div className="space-y-6">
              {course.sessions.map((session, index) => (
                <div
                  key={session.id}
                  className={`group bg-gradient-to-r from-gray-900/80 to-gray-800/40 rounded-xl p-6 border border-gray-700/50 hover:border-[#0fd8d7]/50 transition-all duration-500 hover:transform hover:translate-x-2 hover:shadow-xl hover:shadow-[#0fd8d7]/20 backdrop-blur-sm animate-fade-in-up`}
                  style={{ animationDelay: `${800 + index * 100}ms` }}
                >
                  <Link href={`/courses/${course.id}/sessions/${session.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] text-black rounded-full w-12 h-12 flex items-center justify-center font-bold mr-6 group-hover:scale-110 transition-transform duration-300">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#0fd8d7] transition-colors duration-300">
                            {session.title}
                          </h3>
                          <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">
                            {session.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <BookOpen className="w-5 h-5 text-gray-500 group-hover:text-[#0fd8d7] transition-colors duration-300" />
                        <Play className="w-6 h-6 text-[#0fd8d7] group-hover:scale-110 transition-transform duration-300" />
                      </div>
                    </div>
                  </Link>

                  {/* Video preview if available */}
                  {isValidUrl(session.video_url) && (
                    <div className="mt-4 rounded-lg overflow-hidden">
                      {session.video_url?.includes("youtube.com") ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${session.video_url.split("v=")[1]}`}
                          className="w-full h-64"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : (
                        <video
                          controls
                          className="w-full rounded-lg"
                          onError={(e) => console.error("Video load error:", e)}
                        >
                          <source src={session.video_url!} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
