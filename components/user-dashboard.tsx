"use client"

import { useState, useEffect } from "react"
import { X, BarChart3, BookOpen, CheckCircle, Clock, Trophy, Rocket } from "lucide-react"
import { userProgressService, courseService, projectService, sessionProgressService } from "@/lib/database"

interface UserDashboardProps {
  isOpen: boolean
  onClose: () => void
  userCode: string
}

export function UserDashboard({ isOpen, onClose, userCode }: UserDashboardProps) {
  const [userProgress, setUserProgress] = useState<any>(null)
  const [courses, setCourses] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [sessionProgress, setSessionProgress] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userCode) {
      loadProgress()
    }
  }, [isOpen, userCode])

  const loadProgress = async () => {
    setLoading(true)
    try {
      const [progressData, coursesData, projectsData, sessionProgressData] = await Promise.all([
        userProgressService.findByUserCode(userCode),
        courseService.getAll(),
        projectService.getAll(),
        sessionProgressService.findByUser(userCode),
      ])

      setUserProgress(progressData)
      setCourses(coursesData)
      setProjects(projectsData)
      setSessionProgress(sessionProgressData)
    } catch (error) {
      console.error("Error loading progress:", error)
    } finally {
      setLoading(false)
    }
  }

  const getProgressPercentage = () => {
    if (!userProgress || !courses.length) return 0
    const totalSessions = courses.reduce((total, course) => total + course.sessions.length, 0)
    return Math.round((userProgress.completed_sessions.length / totalSessions) * 100)
  }

  const getCourseProgress = (courseId: string) => {
    if (!userProgress) return 0
    const course = courses.find((c) => c.id === courseId)
    if (!course) return 0

    const courseCompletedSessions = userProgress.completed_sessions.filter((session: string) =>
      session.startsWith(`${courseId}-`),
    )
    return Math.round((courseCompletedSessions.length / course.sessions.length) * 100)
  }

  const getProjectProgress = (categoryId: string) => {
    const category = projects.find((c) => c.id === categoryId)
    if (!category) return { completed: 0, total: 0 }

    // This would need to be implemented with project progress tracking
    return { completed: 0, total: category.projects.length }
  }

  const getCurrentCourse = () => {
    if (!userProgress?.current_course) return null
    return courses.find((c) => c.id === userProgress.current_course)
  }

  const getCurrentSession = () => {
    const currentCourse = getCurrentCourse()
    if (!currentCourse || !userProgress?.current_session) return null
    return currentCourse.sessions.find((s) => s.id === userProgress.current_session)
  }

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 border border-gray-700">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0fd8d7] mx-auto mb-4"></div>
            <p className="text-gray-400">Loading progress...</p>
          </div>
        </div>
      </div>
    )
  }

  const progressPercentage = getProgressPercentage()
  const currentCourse = getCurrentCourse()
  const currentSession = getCurrentSession()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center">
            <BarChart3 className="w-6 h-6 text-[#0fd8d7] mr-3" />
            <h2 className="text-2xl font-bold text-white">My Learning Progress</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Overall Progress */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl p-6 border border-gray-600/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Overall Progress</h3>
                <div className="text-3xl font-bold text-[#0fd8d7]">{progressPercentage}%</div>
              </div>

              <div className="mb-4">
                <div className="bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {userProgress?.completed_sessions.length || 0}
                  </div>
                  <div className="text-gray-400">Sessions Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{userProgress?.login_count || 0}</div>
                  <div className="text-gray-400">Total Logins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400 mb-1">
                    {courses.reduce((total, course) => total + course.sessions.length, 0) -
                      (userProgress?.completed_sessions.length || 0)}
                  </div>
                  <div className="text-gray-400">Sessions Remaining</div>
                </div>
              </div>
            </div>
          </div>

          {/* Current Activity */}
          {currentCourse && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <BookOpen className="w-5 h-5 mr-2 text-[#0fd8d7]" />
                Current Activity
              </h3>
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl p-6 border border-gray-600/50">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-3">{currentCourse.icon}</span>
                  <div>
                    <h4 className="text-lg font-semibold text-white">{currentCourse.title}</h4>
                    {currentSession && <p className="text-gray-400">Currently on: {currentSession.title}</p>}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  Last active:{" "}
                  {userProgress?.last_activity ? new Date(userProgress.last_activity).toLocaleDateString() : "Never"}
                </div>
              </div>
            </div>
          )}

          {/* Course Progress */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Trophy className="w-5 h-5 mr-2 text-[#0fd8d7]" />
              Course Progress
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {courses.map((course) => {
                const courseProgress = getCourseProgress(course.id)
                const courseCompletedSessions =
                  userProgress?.completed_sessions.filter((session: string) => session.startsWith(`${course.id}-`))
                    .length || 0

                return (
                  <div
                    key={course.id}
                    className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl p-4 border border-gray-600/50"
                  >
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">{course.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{course.title}</h4>
                        <div className="text-sm text-gray-400">
                          {courseCompletedSessions}/{course.sessions.length} sessions
                        </div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${courseProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-[#0fd8d7]">{courseProgress}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Project Progress */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Rocket className="w-5 h-5 mr-2 text-[#0fd8d7]" />
              Project Progress
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {projects.map((category) => {
                const projectProgress = getProjectProgress(category.id)
                const progressPercentage =
                  category.projects.length > 0
                    ? Math.round((projectProgress.completed / projectProgress.total) * 100)
                    : 0

                return (
                  <div
                    key={category.id}
                    className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl p-4 border border-gray-600/50"
                  >
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{category.title}</h4>
                        <div className="text-sm text-gray-400">
                          {projectProgress.completed}/{projectProgress.total} projects completed
                        </div>
                      </div>
                    </div>

                    <div className="mb-2">
                      <div className="bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-semibold text-purple-400">{progressPercentage}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-[#0fd8d7]" />
              Recent Activity
            </h3>
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-xl p-4 border border-gray-600/50">
              {userProgress?.completed_sessions.length > 0 ? (
                <div className="space-y-3">
                  {userProgress.completed_sessions
                    .slice(-5)
                    .reverse()
                    .map((sessionId: string, index: number) => {
                      const [courseId, sessionIdOnly] = sessionId.split("-")
                      const course = courses.find((c) => c.id === courseId)
                      const session = course?.sessions.find((s) => s.id === sessionIdOnly)

                      return (
                        <div key={index} className="flex items-center space-x-3">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="text-sm text-white">Completed: {session?.title || "Unknown Session"}</div>
                            <div className="text-xs text-gray-400">{course?.title || "Unknown Course"}</div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No completed sessions yet</p>
                  <p className="text-sm text-gray-500">Start learning to see your progress here!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
