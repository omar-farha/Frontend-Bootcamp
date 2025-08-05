"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Users,
  BarChart3,
  Download,
  Edit3,
  Save,
  Video,
  BookOpen,
  Settings,
  Code,
  Play,
  Rocket,
  Clock,
  Star,
} from "lucide-react"
import { accessCodeService, userProgressService, courseService, projectService } from "@/lib/database"
import type { AccessCode, UserProgress, Course, ProjectCategory } from "@/lib/supabase"

// Add this import at the top
import { isSupabaseConfigured } from "@/lib/database"
// Add this import
import { SetupGuide } from "@/components/setup-guide"

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [projects, setProjects] = useState<ProjectCategory[]>([])
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [activeTab, setActiveTab] = useState<"codes" | "tracking" | "courses" | "projects">("codes")
  const [editingCourse, setEditingCourse] = useState<string | null>(null)
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // Add this state variable with the other useState declarations
  const [showSetupGuide, setShowSetupGuide] = useState(false)

  const ADMIN_PASSWORD = "admin123"

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  const loadData = async () => {
    setLoading(true)
    try {
      const [codesData, progressData, coursesData, projectsData] = await Promise.all([
        accessCodeService.getAll(),
        userProgressService.getAll(),
        courseService.getAll(),
        projectService.getAll(),
      ])

      setAccessCodes(codesData)
      setUserProgress(progressData)
      setCourses(coursesData)
      setProjects(projectsData)
    } catch (error) {
      console.error("Error loading data:", error)
      alert("Error loading data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = ""
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
    } else {
      alert("Invalid admin password")
    }
  }

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCustomerName.trim() || !newCustomerPhone.trim()) {
      alert("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const newCode = await accessCodeService.create({
        code: generateCode(),
        customer_name: newCustomerName.trim(),
        customer_phone: newCustomerPhone.trim(),
        is_active: true,
      })

      setAccessCodes([newCode, ...accessCodes])
      setNewCustomerName("")
      setNewCustomerPhone("")
    } catch (error) {
      console.error("Error generating code:", error)
      alert("Error generating code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleCodeStatus = async (id: string) => {
    const code = accessCodes.find((c) => c.id === id)
    if (!code) return

    setLoading(true)
    try {
      const updatedCode = await accessCodeService.update(id, {
        is_active: !code.is_active,
      })

      setAccessCodes(accessCodes.map((c) => (c.id === id ? updatedCode : c)))
    } catch (error) {
      console.error("Error updating code:", error)
      alert("Error updating code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const deleteCode = async (id: string) => {
    if (!confirm("Are you sure you want to delete this access code?")) return

    setLoading(true)
    try {
      await accessCodeService.delete(id)
      setAccessCodes(accessCodes.filter((c) => c.id !== id))
    } catch (error) {
      console.error("Error deleting code:", error)
      alert("Error deleting code. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Code copied to clipboard!")
  }

  const getProgressPercentage = (completedSessions: string[]) => {
    const totalSessions = courses.reduce((total, course) => total + course.sessions.length, 0)
    return totalSessions > 0 ? Math.round((completedSessions.length / totalSessions) * 100) : 0
  }

  const getCurrentCourseInfo = (userCode: string) => {
    const progress = userProgress.find((p) => p.user_code === userCode)
    if (!progress || !progress.current_course) return null

    const course = courses.find((c) => c.id === progress.current_course)
    const session = course?.sessions.find((s) => s.id === progress.current_session)

    return { course, session }
  }

  const exportProgressData = () => {
    const csvData = userProgress.map((progress) => {
      const customer = accessCodes.find((code) => code.code === progress.user_code)
      const currentInfo = getCurrentCourseInfo(progress.user_code)

      return {
        "Customer Name": customer?.customer_name || "Unknown",
        Phone: customer?.customer_phone || "Unknown",
        "Access Code": progress.user_code,
        "Completed Sessions": progress.completed_sessions.length,
        "Progress %": getProgressPercentage(progress.completed_sessions),
        "Current Course": currentInfo?.course?.title || "Not started",
        "Current Session": currentInfo?.session?.title || "Not started",
        "Login Count": progress.login_count,
        "Last Activity": new Date(progress.last_activity).toLocaleString(),
      }
    })

    const csvContent = [
      Object.keys(csvData[0] || {}).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `student-progress-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const updateCourse = async (courseId: string, field: string, value: string) => {
    setLoading(true)
    try {
      const updatedCourse = await courseService.update(courseId, { [field]: value })
      setCourses(courses.map((course) => (course.id === courseId ? { ...course, [field]: value } : course)))
    } catch (error) {
      console.error("Error updating course:", error)
      alert("Error updating course. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const updateSession = async (courseId: string, sessionId: string, field: string, value: string) => {
    setLoading(true)
    try {
      await courseService.updateSession(courseId, sessionId, { [field]: value })
      setCourses(
        courses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                sessions: course.sessions.map((session) =>
                  session.id === sessionId ? { ...session, [field]: value } : session,
                ),
              }
            : course,
        ),
      )
    } catch (error) {
      console.error("Error updating session:", error)
      alert("Error updating session. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const updateSessionTasks = async (courseId: string, sessionId: string, tasks: string[]) => {
    setLoading(true)
    try {
      await courseService.updateSession(courseId, sessionId, { tasks })
      setCourses(
        courses.map((course) =>
          course.id === courseId
            ? {
                ...course,
                sessions: course.sessions.map((session) =>
                  session.id === sessionId ? { ...session, tasks } : session,
                ),
              }
            : course,
        ),
      )
    } catch (error) {
      console.error("Error updating session tasks:", error)
      alert("Error updating session tasks. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const updateProjectCategory = async (categoryId: string, field: string, value: string) => {
    setLoading(true)
    try {
      await projectService.updateCategory(categoryId, { [field]: value })
      setProjects(projects.map((category) => (category.id === categoryId ? { ...category, [field]: value } : category)))
    } catch (error) {
      console.error("Error updating project category:", error)
      alert("Error updating project category. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const updateProject = async (categoryId: string, projectId: string, field: string, value: string | string[]) => {
    setLoading(true)
    try {
      await projectService.updateProject(categoryId, projectId, { [field]: value })
      setProjects(
        projects.map((category) =>
          category.id === categoryId
            ? {
                ...category,
                projects: category.projects.map((project) =>
                  project.id === projectId ? { ...project, [field]: value } : project,
                ),
              }
            : category,
        ),
      )
    } catch (error) {
      console.error("Error updating project:", error)
      alert("Error updating project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const addNewProject = async (categoryId: string) => {
    const newProject = {
      id: `project-${Date.now()}`,
      category_id: categoryId,
      title: "New Project",
      description: "Project description",
      difficulty: "Beginner" as const,
      technologies: ["HTML5", "CSS3"],
      requirements: ["Requirement 1", "Requirement 2"],
      instructions: "Project instructions go here...",
      estimated_time: "4-6 hours",
    }

    setLoading(true)
    try {
      const createdProject = await projectService.createProject(newProject)
      setProjects(
        projects.map((category) =>
          category.id === categoryId ? { ...category, projects: [...category.projects, createdProject] } : category,
        ),
      )
    } catch (error) {
      console.error("Error creating project:", error)
      alert("Error creating project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (categoryId: string, projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    setLoading(true)
    try {
      await projectService.deleteProject(categoryId, projectId)
      setProjects(
        projects.map((category) =>
          category.id === categoryId
            ? { ...category, projects: category.projects.filter((p) => p.id !== projectId) }
            : category,
        ),
      )
    } catch (error) {
      console.error("Error deleting project:", error)
      alert("Error deleting project. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-md w-full border border-gray-700">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#0fd8d7] mb-2">Admin Panel</h1>
            <p className="text-gray-400">Enter your admin credentials</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Admin Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#0fd8d7] transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] text-black font-semibold py-3 px-6 rounded-lg hover:from-[#0bc5c4] hover:to-[#0fd8d7] transition-all duration-300"
            >
              Login to Admin Panel
            </button>
          </form>
        </div>
      </div>
    )
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

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#0fd8d7]">Admin Panel</h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Add this component after the header div and before the tab navigation */}
        <div className="mb-6">
          <div
            className={`p-4 rounded-lg border ${
              isSupabaseConfigured()
                ? "bg-green-900/20 border-green-500/30 text-green-400"
                : "bg-yellow-900/20 border-yellow-500/30 text-yellow-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-3 ${isSupabaseConfigured() ? "bg-green-400" : "bg-yellow-400"}`}
                ></div>
                <span className="font-semibold">
                  {isSupabaseConfigured()
                    ? "🗄️ Database: Supabase (Production Ready)"
                    : "💾 Database: LocalStorage (Development Mode)"}
                </span>
              </div>
              {!isSupabaseConfigured() && (
                <button
                  onClick={() => setShowSetupGuide(true)}
                  className="bg-[#0fd8d7] text-black px-4 py-2 rounded-lg font-semibold hover:bg-[#0bc5c4] transition-colors"
                >
                  Setup Database
                </button>
              )}
            </div>
            {!isSupabaseConfigured() && (
              <p className="text-sm mt-2 text-yellow-300">
                Configure Supabase environment variables to enable production database features.
              </p>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("codes")}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center ${
              activeTab === "codes"
                ? "border-[#0fd8d7] text-[#0fd8d7]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Code className="w-4 h-4 mr-2" />
            Access Codes
          </button>
          <button
            onClick={() => setActiveTab("tracking")}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center ${
              activeTab === "tracking"
                ? "border-[#0fd8d7] text-[#0fd8d7]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Student Tracking
          </button>
          <button
            onClick={() => setActiveTab("courses")}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center ${
              activeTab === "courses"
                ? "border-[#0fd8d7] text-[#0fd8d7]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4 mr-2" />
            Course Management
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`pb-3 px-1 border-b-2 transition-colors flex items-center ${
              activeTab === "projects"
                ? "border-[#0fd8d7] text-[#0fd8d7]"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Project Management
          </button>
        </div>

        {/* Access Codes Tab */}
        {activeTab === "codes" && (
          <>
            <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-[#0fd8d7]" />
                Generate New Access Code
              </h3>
              <form onSubmit={handleGenerateCode} className="grid md:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#0fd8d7]"
                  required
                />
                <input
                  type="tel"
                  placeholder="Customer Phone"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#0fd8d7]"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] text-black font-semibold py-2 px-4 rounded-lg hover:from-[#0bc5c4] hover:to-[#0fd8d7] transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate Code"}
                </button>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Access Codes ({accessCodes.length})</h3>
              <div className="space-y-3">
                {accessCodes.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No access codes generated yet.</p>
                ) : (
                  accessCodes.map((codeData) => {
                    const progress = userProgress.find((p) => p.user_code === codeData.code)
                    const currentInfo = getCurrentCourseInfo(codeData.code)

                    return (
                      <div
                        key={codeData.id}
                        className={`bg-gray-800/50 rounded-lg p-4 border ${
                          codeData.is_active ? "border-green-500/30" : "border-red-500/30"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 mb-2">
                              <span className="font-mono text-lg font-bold text-[#0fd8d7]">{codeData.code}</span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  codeData.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                }`}
                              >
                                {codeData.is_active ? "Active" : "Inactive"}
                              </span>
                              {progress && (
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                                  {getProgressPercentage(progress.completed_sessions)}% Complete
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-300 grid md:grid-cols-2 gap-2">
                              <div>
                                <p>
                                  <strong>Customer:</strong> {codeData.customer_name}
                                </p>
                                <p>
                                  <strong>Phone:</strong> {codeData.customer_phone}
                                </p>
                                <p>
                                  <strong>Created:</strong> {new Date(codeData.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              {progress && (
                                <div>
                                  <p>
                                    <strong>Logins:</strong> {progress.login_count}
                                  </p>
                                  <p>
                                    <strong>Sessions Done:</strong> {progress.completed_sessions.length}
                                  </p>
                                  <p>
                                    <strong>Current:</strong> {currentInfo?.course?.title || "Not started"}
                                  </p>
                                  <p>
                                    <strong>Last Active:</strong>{" "}
                                    {new Date(progress.last_activity).toLocaleDateString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => copyToClipboard(codeData.code)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                              title="Copy Code"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleCodeStatus(codeData.id)}
                              disabled={loading}
                              className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                                codeData.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                              }`}
                              title={codeData.is_active ? "Deactivate" : "Activate"}
                            >
                              {codeData.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => deleteCode(codeData.id)}
                              disabled={loading}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete Code"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* Student Tracking Tab */}
        {activeTab === "tracking" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <Users className="w-5 h-5 mr-2 text-[#0fd8d7]" />
                Student Progress Tracking ({userProgress.length} active students)
              </h3>
              <button
                onClick={exportProgressData}
                className="bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] text-black font-semibold py-2 px-4 rounded-lg hover:from-[#0bc5c4] hover:to-[#0fd8d7] transition-all duration-300 flex items-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </button>
            </div>

            {userProgress.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No student activity yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {userProgress.map((progress) => {
                  const customer = accessCodes.find((code) => code.code === progress.user_code)
                  const currentInfo = getCurrentCourseInfo(progress.user_code)
                  const progressPercentage = getProgressPercentage(progress.completed_sessions)

                  return (
                    <div key={progress.user_code} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700/50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-semibold text-white mb-1">
                            {customer?.customer_name || "Unknown Student"}
                          </h4>
                          <p className="text-gray-400">Code: {progress.user_code}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[#0fd8d7] mb-1">{progressPercentage}%</div>
                          <div className="text-sm text-gray-400">Complete</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="bg-gray-700 rounded-full h-2 mb-2">
                          <div
                            className="bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                        <div className="text-sm text-gray-400">
                          {progress.completed_sessions.length} of{" "}
                          {courses.reduce((total, course) => total + course.sessions.length, 0)} sessions completed
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400 mb-1">Current Course</p>
                          <p className="text-white font-semibold">{currentInfo?.course?.title || "Not started"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Current Session</p>
                          <p className="text-white font-semibold">{currentInfo?.session?.title || "Not started"}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-1">Activity</p>
                          <p className="text-white font-semibold">{progress.login_count} logins</p>
                          <p className="text-gray-400 text-xs">
                            Last: {new Date(progress.last_activity).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Course Management Tab */}
        {activeTab === "courses" && (
          <div className="space-y-8">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-[#0fd8d7]" />
              Course Management
            </h3>

            {courses.map((course) => (
              <div key={course.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-3xl mr-4">{course.icon}</span>
                    {editingCourse === course.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={course.title}
                          onChange={(e) => updateCourse(course.id, "title", e.target.value)}
                          className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-[#0fd8d7]"
                        />
                        <textarea
                          value={course.description}
                          onChange={(e) => updateCourse(course.id, "description", e.target.value)}
                          className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-[#0fd8d7] w-full"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-xl font-semibold text-white">{course.title}</h4>
                        <p className="text-gray-400">{course.description}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setEditingCourse(editingCourse === course.id ? null : course.id)}
                    disabled={loading}
                    className="p-2 bg-[#0fd8d7] text-black rounded-lg hover:bg-[#0bc5c4] transition-colors disabled:opacity-50"
                  >
                    {editingCourse === course.id ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  </button>
                </div>

                <div className="space-y-4">
                  {course.sessions.map((session, index) => (
                    <div key={session.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <span className="bg-[#0fd8d7] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </span>
                          {editingSession === session.id ? (
                            <input
                              type="text"
                              value={session.title}
                              onChange={(e) => updateSession(course.id, session.id, "title", e.target.value)}
                              className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:border-[#0fd8d7]"
                            />
                          ) : (
                            <h5 className="font-semibold text-white">{session.title}</h5>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingSession(editingSession === session.id ? null : session.id)}
                          disabled={loading}
                          className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {editingSession === session.id ? <Save className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
                        </button>
                      </div>

                      {editingSession === session.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Description</label>
                            <textarea
                              value={session.description}
                              onChange={(e) => updateSession(course.id, session.id, "description", e.target.value)}
                              className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Content</label>
                            <textarea
                              value={session.content}
                              onChange={(e) => updateSession(course.id, session.id, "content", e.target.value)}
                              className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Assignment</label>
                            <textarea
                              value={session.assignment}
                              onChange={(e) => updateSession(course.id, session.id, "assignment", e.target.value)}
                              className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1 flex items-center">
                              <Video className="w-4 h-4 mr-1" />
                              Video URL (Google Drive or YouTube)
                            </label>
                            <input
                              type="url"
                              value={session.video_url || ""}
                              onChange={(e) => updateSession(course.id, session.id, "video_url", e.target.value)}
                              placeholder="https://drive.google.com/file/d/... or https://youtube.com/watch?v=..."
                              className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Tasks (one per line)</label>
                            <textarea
                              value={session.tasks?.join("\n") || ""}
                              onChange={(e) =>
                                updateSessionTasks(
                                  course.id,
                                  session.id,
                                  e.target.value.split("\n").filter((task) => task.trim()),
                                )
                              }
                              className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                              rows={4}
                              placeholder="Task 1&#10;Task 2&#10;Task 3"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-300">
                          <p className="mb-2">{session.description}</p>
                          {session.video_url && (
                            <div className="flex items-center text-[#0fd8d7] mb-2">
                              <Play className="w-4 h-4 mr-1" />
                              Video:{" "}
                              {session.video_url.length > 50
                                ? session.video_url.substring(0, 50) + "..."
                                : session.video_url}
                            </div>
                          )}
                          <p className="text-gray-400">Tasks: {session.tasks?.length || 0}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Project Management Tab */}
        {activeTab === "projects" && (
          <div className="space-y-8">
            <h3 className="text-lg font-semibold text-white flex items-center">
              <Rocket className="w-5 h-5 mr-2 text-[#0fd8d7]" />
              Project Management
            </h3>

            {projects.map((category) => (
              <div key={category.id} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <span className="text-3xl mr-4">{category.icon}</span>
                    {editingCategory === category.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={category.title}
                          onChange={(e) => updateProjectCategory(category.id, "title", e.target.value)}
                          className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-[#0fd8d7]"
                        />
                        <textarea
                          value={category.description}
                          onChange={(e) => updateProjectCategory(category.id, "description", e.target.value)}
                          className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600 focus:border-[#0fd8d7] w-full"
                          rows={2}
                        />
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-xl font-semibold text-white">{category.title}</h4>
                        <p className="text-gray-400">{category.description}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => addNewProject(category.id)}
                      disabled={loading}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      title="Add New Project"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingCategory(editingCategory === category.id ? null : category.id)}
                      disabled={loading}
                      className="p-2 bg-[#0fd8d7] text-black rounded-lg hover:bg-[#0bc5c4] transition-colors disabled:opacity-50"
                    >
                      {editingCategory === category.id ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {category.projects.map((project) => (
                    <div key={project.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className="flex items-center space-x-3">
                            {editingProject === project.id ? (
                              <input
                                type="text"
                                value={project.title}
                                onChange={(e) => updateProject(category.id, project.id, "title", e.target.value)}
                                className="bg-gray-600 text-white px-3 py-1 rounded border border-gray-500 focus:border-[#0fd8d7]"
                              />
                            ) : (
                              <h5 className="font-semibold text-white">{project.title}</h5>
                            )}
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                project.difficulty === "Beginner"
                                  ? "bg-green-500/20 text-green-400"
                                  : project.difficulty === "Intermediate"
                                    ? "bg-yellow-500/20 text-yellow-400"
                                    : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {project.difficulty}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingProject(editingProject === project.id ? null : project.id)}
                            disabled={loading}
                            className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {editingProject === project.id ? (
                              <Save className="w-3 h-3" />
                            ) : (
                              <Edit3 className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteProject(category.id, project.id)}
                            disabled={loading}
                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {editingProject === project.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Description</label>
                            <textarea
                              value={project.description}
                              onChange={(e) => updateProject(category.id, project.id, "description", e.target.value)}
                              className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                              rows={2}
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-300 mb-1">Difficulty</label>
                              <select
                                value={project.difficulty}
                                onChange={(e) => updateProject(category.id, project.id, "difficulty", e.target.value)}
                                className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                              >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm text-gray-300 mb-1">Estimated Time</label>
                              <input
                                type="text"
                                value={project.estimated_time}
                                onChange={(e) =>
                                  updateProject(category.id, project.id, "estimated_time", e.target.value)
                                }
                                className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                                placeholder="4-6 hours"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Technologies (comma separated)</label>
                            <input
                              type="text"
                              value={project.technologies.join(", ")}
                              onChange={(e) =>
                                updateProject(
                                  category.id,
                                  project.id,
                                  "technologies",
                                  e.target.value.split(", ").filter((t) => t.trim()),
                                )
                              }
                              className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                              placeholder="HTML5, CSS3, JavaScript"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Requirements (one per line)</label>
                            <textarea
                              value={project.requirements.join("\n")}
                              onChange={(e) =>
                                updateProject(
                                  category.id,
                                  project.id,
                                  "requirements",
                                  e.target.value.split("\n").filter((r) => r.trim()),
                                )
                              }
                              className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                              rows={4}
                              placeholder="Requirement 1&#10;Requirement 2&#10;Requirement 3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1">Instructions</label>
                            <textarea
                              value={project.instructions}
                              onChange={(e) => updateProject(category.id, project.id, "instructions", e.target.value)}
                              className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                              rows={4}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-300 mb-1 flex items-center">
                              <Video className="w-4 h-4 mr-1" />
                              Video Tutorial URL (Google Drive or YouTube)
                            </label>
                            <input
                              type="url"
                              value={project.video_url || ""}
                              onChange={(e) => updateProject(category.id, project.id, "video_url", e.target.value)}
                              placeholder="https://drive.google.com/file/d/... or https://youtube.com/watch?v=..."
                              className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                            />
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm text-gray-300 mb-1">Demo URL (optional)</label>
                              <input
                                type="url"
                                value={project.demo_url || ""}
                                onChange={(e) => updateProject(category.id, project.id, "demo_url", e.target.value)}
                                className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                                placeholder="https://example.com"
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-gray-300 mb-1">Source Code URL (optional)</label>
                              <input
                                type="url"
                                value={project.source_code || ""}
                                onChange={(e) => updateProject(category.id, project.id, "source_code", e.target.value)}
                                className="w-full bg-gray-600 text-white px-3 py-2 rounded border border-gray-500 focus:border-[#0fd8d7]"
                                placeholder="https://github.com/..."
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-300">
                          <p className="mb-2">{project.description}</p>
                          <div className="flex items-center space-x-4 text-gray-400 mb-2">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{project.estimated_time}</span>
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              <span>{project.requirements.length} requirements</span>
                            </div>
                            <div className="flex items-center">
                              <Code className="w-4 h-4 mr-1" />
                              <span>{project.technologies.join(", ")}</span>
                            </div>
                            {project.video_url && (
                              <div className="flex items-center text-[#0fd8d7]">
                                <Play className="w-4 h-4 mr-1" />
                                <span>Video Tutorial</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Add the SetupGuide component at the end, before the closing div */}
      <SetupGuide isOpen={showSetupGuide} onClose={() => setShowSetupGuide(false)} />
    </div>
  )
}
