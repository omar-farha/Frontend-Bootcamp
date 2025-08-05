"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { AccessCodeModal } from "@/components/access-code-modal"
import { UserDashboard } from "@/components/user-dashboard"
import { BarChart3 } from "lucide-react"
import { accessCodeService, userProgressService, courseService } from "@/lib/database"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [showUserDashboard, setShowUserDashboard] = useState(false)
  const [userCode, setUserCode] = useState<string>("")
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const savedCode = localStorage.getItem("access_code")
        if (savedCode) {
          // Verify the code is still valid
          const validCode = await accessCodeService.findByCode(savedCode)
          if (validCode && validCode.is_active) {
            setIsAuthenticated(true)
            setUserCode(savedCode)
            // Update user tracking
            await updateUserTracking(savedCode, "login")
          } else {
            localStorage.removeItem("access_code")
          }
        }

        // Load courses
        const coursesData = await courseService.getAll()
        setCourses(coursesData)
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuthAndLoadData()
  }, [])

  const updateUserTracking = async (userCode: string, action: string, courseId?: string, sessionId?: string) => {
    try {
      // Get existing progress or create new
      let existingProgress = await userProgressService.findByUserCode(userCode)

      if (!existingProgress) {
        // Get user info from access code
        const accessCode = await accessCodeService.findByCode(userCode)

        existingProgress = {
          user_code: userCode,
          customer_name: accessCode?.customer_name || "Unknown",
          completed_sessions: [],
          last_activity: new Date().toISOString(),
          current_course: courseId,
          current_session: sessionId,
          login_count: 0,
        }
      }

      // Update progress
      const updatedProgress = {
        ...existingProgress,
        last_activity: new Date().toISOString(),
        login_count: action === "login" ? existingProgress.login_count + 1 : existingProgress.login_count,
        current_course: courseId || existingProgress.current_course,
        current_session: sessionId || existingProgress.current_session,
      }

      await userProgressService.upsert(updatedProgress)
    } catch (error) {
      console.error("Error updating user tracking:", error)
    }
  }

  const handleAccessGranted = async (code: string) => {
    setIsAuthenticated(true)
    setUserCode(code)
    setShowAccessModal(false)
    localStorage.setItem("access_code", code)
    await updateUserTracking(code, "login")
  }

  const handleLogout = () => {
    localStorage.removeItem("access_code")
    setIsAuthenticated(false)
    setUserCode("")
  }

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
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Animated background */}
        <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black animate-gradient-shift"></div>
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,216,215,0.1),transparent_50%)] animate-pulse-slow"></div>

        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto px-4">
            <div className="animate-fade-in-up">
              <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-white via-[#0fd8d7] to-white bg-clip-text text-transparent animate-gradient-text">
                Frontend Academy
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">Premium courses in HTML, CSS, and JavaScript</p>
              <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm mb-8">
                <h2 className="text-2xl font-bold text-[#0fd8d7] mb-4">Course Price: 400 EGP</h2>
                <p className="text-gray-300 mb-6">Get access to all courses with lifetime updates and support</p>
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">To purchase:</p>
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <p className="text-white mb-2">1. Send 400 EGP via WhatsApp</p>
                    <p className="text-white mb-2">2. Receive your unique access code</p>
                    <p className="text-white">3. Enter the code below to start learning</p>
                  </div>
                  <a
                    href="https://wa.me/YOUR_WHATSAPP_NUMBER?text=I want to purchase the Frontend Academy course for 400 EGP"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 mr-4"
                  >
                    💬 Contact on WhatsApp
                  </a>
                  <button
                    onClick={() => setShowAccessModal(true)}
                    className="inline-block bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] text-black font-semibold py-3 px-6 rounded-lg hover:from-[#0bc5c4] hover:to-[#0fd8d7] transition-all duration-300"
                  >
                    Enter Access Code
                  </button>
                </div>
              </div>

              {/* Admin Access */}
              <Link href="/admin" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>

        <AccessCodeModal
          isOpen={showAccessModal}
          onClose={() => setShowAccessModal(false)}
          onAccessGranted={handleAccessGranted}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black animate-gradient-shift"></div>
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,216,215,0.1),transparent_50%)] animate-pulse-slow"></div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-gray-800/50 backdrop-blur-sm bg-black/20">
          <div className="container mx-auto px-4 py-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-[#0fd8d7] animate-fade-in-up">Frontend Academy</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowUserDashboard(true)}
                className="flex items-center text-[#0fd8d7] hover:text-[#0bc5c4] transition-colors"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                My Progress
              </button>
              <span className="text-sm text-gray-400">Code: {userCode}</span>
              <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 transition-colors">
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="container mx-auto px-4 py-20 text-center">
          <div className="animate-fade-in-up animation-delay-200">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-[#0fd8d7] to-white bg-clip-text text-transparent animate-gradient-text">
              Master Frontend Development
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
              Learn HTML, CSS, and JavaScript through structured courses designed for beginners. Build real projects and
              track your progress as you become a frontend developer.
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-[#0fd8d7] to-transparent mx-auto animate-fade-in-up animation-delay-600"></div>
          </div>
        </section>

        {/* Courses Section */}
        <section className="container mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center mb-16 animate-fade-in-up animation-delay-800">
            Choose Your Learning Path
          </h2>
          <div className="grid md:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {courses.map((course, index) => (
              <div
                key={course.id}
                className={`group bg-gradient-to-br from-gray-900/80 to-gray-800/40 rounded-2xl p-8 border border-gray-700/50 hover:border-[#0fd8d7]/50 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-[#0fd8d7]/20 backdrop-blur-sm animate-fade-in-up`}
                style={{ animationDelay: `${1000 + index * 200}ms` }}
              >
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {course.icon}
                </div>
                <h3 className="text-2xl font-bold mb-4 text-[#0fd8d7] group-hover:text-[#0bc5c4] transition-colors duration-300">
                  {course.title}
                </h3>
                <p className="text-gray-300 mb-6 leading-relaxed group-hover:text-white transition-colors duration-300">
                  {course.description}
                </p>
                <div className="mb-8">
                  <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">
                    {course.sessions.length} Sessions
                  </span>
                </div>
                <Link
                  href={`/courses/${course.id}`}
                  onClick={() => updateUserTracking(userCode, "course_access", course.id)}
                  className="inline-block w-full bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] text-black font-semibold py-4 px-6 rounded-xl text-center hover:from-[#0bc5c4] hover:to-[#0fd8d7] transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-[#0fd8d7]/30"
                >
                  Start Learning
                </Link>
              </div>
            ))}

            {/* Projects Card */}
            <div
              className={`group bg-gradient-to-br from-purple-900/80 to-purple-800/40 rounded-2xl p-8 border border-purple-700/50 hover:border-purple-500/50 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 backdrop-blur-sm animate-fade-in-up`}
              style={{ animationDelay: `${1000 + courses.length * 200}ms` }}
            >
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🚀</div>
              <h3 className="text-2xl font-bold mb-4 text-purple-400 group-hover:text-purple-300 transition-colors duration-300">
                Projects
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed group-hover:text-white transition-colors duration-300">
                Apply your skills with hands-on projects. Build real websites and applications.
              </p>
              <div className="mb-8">
                <span className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full">Practice & Build</span>
              </div>
              <Link
                href="/projects"
                className="inline-block w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl text-center hover:from-purple-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30"
              >
                View Projects
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="container mx-auto px-4 py-20 border-t border-gray-800/50">
          <div className="grid md:grid-cols-4 gap-12 max-w-6xl mx-auto text-center">
            {[
              { icon: "🎥", title: "Video Lessons", desc: "Learn through comprehensive video tutorials" },
              { icon: "📝", title: "Assignments", desc: "Practice with hands-on coding assignments" },
              { icon: "🚀", title: "Real Projects", desc: "Build actual websites and applications" },
              { icon: "📊", title: "Progress Tracking", desc: "Monitor your learning journey" },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className={`group animate-fade-in-up`}
                style={{ animationDelay: `${1800 + index * 200}ms` }}
              >
                <div className="text-4xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-[#0fd8d7] group-hover:text-[#0bc5c4] transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-300 group-hover:text-white transition-colors duration-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 py-12 backdrop-blur-sm bg-black/20">
          <div className="container mx-auto px-4 text-center text-gray-400">
            <p className="animate-fade-in-up animation-delay-2400">
              &copy; 2024 Frontend Academy. Premium coding education.
            </p>
          </div>
        </footer>
      </div>

      <UserDashboard isOpen={showUserDashboard} onClose={() => setShowUserDashboard(false)} userCode={userCode} />
    </div>
  )
}
