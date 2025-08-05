"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowLeft, Clock, Star, Code, ExternalLink, CheckCircle, Circle, Play, Video } from "lucide-react"
import { accessCodeService, projectService, projectProgressService } from "@/lib/database"

interface ProjectPageProps {
  params: {
    categoryId: string
    projectId: string
  }
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [project, setProject] = useState<any>(null)
  const [completedRequirements, setCompletedRequirements] = useState<string[]>([])
  const [userCode, setUserCode] = useState<string>("")

  useEffect(() => {
    const checkAuthAndLoadProject = async () => {
      try {
        const savedCode = localStorage.getItem("access_code")
        if (!savedCode) {
          window.location.href = "/"
          return
        }

        const validCode = await accessCodeService.findByCode(savedCode)
        if (!validCode || !validCode.is_active) {
          localStorage.removeItem("access_code")
          window.location.href = "/"
          return
        }

        setUserCode(savedCode)
        setIsAuthenticated(true)

        // Load project data
        const categories = await projectService.getAll()
        const category = categories.find((c) => c.id === params.categoryId)
        const projectData = category?.projects.find((p: any) => p.id === params.projectId)

        if (!projectData) {
          window.location.href = "/projects"
          return
        }

        setProject(projectData)

        // Load project progress
        const progress = await projectProgressService.findByUserAndProject(
          savedCode,
          params.categoryId,
          params.projectId,
        )

        if (progress) {
          setCompletedRequirements(progress.completed_requirements)
        }
      } catch (error) {
        console.error("Error loading project:", error)
        window.location.href = "/"
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndLoadProject()
  }, [params.categoryId, params.projectId])

  const toggleRequirement = async (requirement: string) => {
    if (!userCode) return

    let updated: string[]
    if (completedRequirements.includes(requirement)) {
      updated = completedRequirements.filter((req) => req !== requirement)
    } else {
      updated = [...completedRequirements, requirement]
    }

    setCompletedRequirements(updated)

    try {
      await projectProgressService.upsert({
        user_code: userCode,
        project_id: params.projectId,
        category_id: params.categoryId,
        completed_requirements: updated,
        is_completed: updated.length === project.requirements.length,
      })
    } catch (error) {
      console.error("Error updating project progress:", error)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "Intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "Advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getVideoEmbedUrl = (url: string) => {
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0]
      return `https://www.youtube.com/embed/${videoId}`
    } else if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0]
      return `https://www.youtube.com/embed/${videoId}`
    } else if (url.includes("drive.google.com/file/d/")) {
      const fileId = url.split("/file/d/")[1]?.split("/")[0]
      return `https://drive.google.com/file/d/${fileId}/preview`
    }
    return url
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0fd8d7] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !project) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Project Not Found</h1>
          <Link href="/projects" className="text-[#0fd8d7] hover:text-[#0bc5c4] transition-colors">
            Back to Projects
          </Link>
        </div>
      </div>
    )
  }

  const progressPercentage = Math.round((completedRequirements.length / project.requirements.length) * 100)

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
          {/* Back Button */}
          <Link
            href="/projects"
            className="inline-flex items-center text-[#0fd8d7] hover:text-[#0bc5c4] mb-8 transition-all duration-300 hover:transform hover:translate-x-1 animate-fade-in-up animation-delay-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Project Header */}
              <div className="animate-fade-in-up animation-delay-400">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-[#0fd8d7] to-white bg-clip-text text-transparent mb-2">
                      {project.title}
                    </h1>
                    <p className="text-xl text-gray-300">{project.description}</p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold border ${getDifficultyColor(project.difficulty)}`}
                  >
                    {project.difficulty}
                  </span>
                </div>

                <div className="flex items-center space-x-6 text-gray-400 mb-6">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-[#0fd8d7]" />
                    <span>{project.estimated_time}</span>
                  </div>
                  <div className="flex items-center">
                    <Code className="w-5 h-5 mr-2 text-[#0fd8d7]" />
                    <span>{project.requirements.length} Requirements</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-5 h-5 mr-2 text-[#0fd8d7]" />
                    <span>{progressPercentage}% Complete</span>
                  </div>
                  {project.video_url && (
                    <div className="flex items-center">
                      <Video className="w-5 h-5 mr-2 text-[#0fd8d7]" />
                      <span>Video Tutorial</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-8">
                  {project.technologies.map((tech: string) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-[#0fd8d7]/10 text-[#0fd8d7] rounded-lg text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Video Tutorial */}
              {project.video_url && (
                <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm animate-fade-in-up animation-delay-500">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <Play className="w-6 h-6 mr-2 text-[#0fd8d7]" />
                    Video Tutorial
                  </h2>
                  <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                    <iframe
                      src={getVideoEmbedUrl(project.video_url)}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={`${project.title} Tutorial`}
                    ></iframe>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm animate-fade-in-up animation-delay-600">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Code className="w-6 h-6 mr-2 text-[#0fd8d7]" />
                  Instructions
                </h2>
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{project.instructions}</div>
              </div>

              {/* Demo and Source Links */}
              {(project.demo_url || project.source_code || project.video_url) && (
                <div className="flex flex-wrap gap-4 animate-fade-in-up animation-delay-800">
                  {project.demo_url && (
                    <a
                      href={project.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] text-black font-semibold py-3 px-6 rounded-lg hover:from-[#0bc5c4] hover:to-[#0fd8d7] transition-all duration-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Demo
                    </a>
                  )}
                  {project.source_code && (
                    <a
                      href={project.source_code}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                    >
                      <Code className="w-4 h-4 mr-2" />
                      Source Code
                    </a>
                  )}
                  {project.video_url && (
                    <a
                      href={project.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Watch Tutorial
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Progress */}
              <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm animate-fade-in-up animation-delay-1000">
                <h3 className="text-xl font-bold text-white mb-4">Progress</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Completed</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-[#0fd8d7] to-[#0bc5c4] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-gray-400">
                  {completedRequirements.length} of {project.requirements.length} requirements completed
                </p>
              </div>

              {/* Requirements Checklist */}
              <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/40 rounded-xl p-6 border border-gray-700/50 backdrop-blur-sm animate-fade-in-up animation-delay-1200">
                <h3 className="text-xl font-bold text-white mb-4">Requirements</h3>
                <div className="space-y-3">
                  {project.requirements.map((requirement: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-start space-x-3 cursor-pointer group"
                      onClick={() => toggleRequirement(requirement)}
                    >
                      {completedRequirements.includes(requirement) ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-500 group-hover:text-[#0fd8d7] mt-0.5 flex-shrink-0 transition-colors" />
                      )}
                      <span
                        className={`text-sm ${
                          completedRequirements.includes(requirement)
                            ? "text-green-400 line-through"
                            : "text-gray-300 group-hover:text-white"
                        } transition-colors`}
                      >
                        {requirement}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
