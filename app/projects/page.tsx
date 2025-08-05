"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { ArrowLeft, Clock, Star, Code, ExternalLink } from "lucide-react"
import { accessCodeService, projectService } from "@/lib/database"

export default function ProjectsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    const checkAuthAndLoadProjects = async () => {
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

        setIsAuthenticated(true)

        // Load projects
        const projectsData = await projectService.getAll()
        setCategories(projectsData)
      } catch (error) {
        console.error("Error loading projects:", error)
        window.location.href = "/"
      } finally {
        setIsLoading(false)
      }
    }

    checkAuthAndLoadProjects()
  }, [])

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

  if (!isAuthenticated) {
    return null
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
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center text-[#0fd8d7] hover:text-[#0bc5c4] mb-8 transition-all duration-300 hover:transform hover:translate-x-1 animate-fade-in-up animation-delay-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          {/* Page Header */}
          <div className="mb-16 animate-fade-in-up animation-delay-400">
            <div className="flex items-center mb-6">
              <span className="text-6xl mr-6 animate-bounce-slow">🚀</span>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-[#0fd8d7] to-white bg-clip-text text-transparent">
                Practice Projects
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-8 max-w-4xl leading-relaxed">
              Apply your skills with hands-on projects. Build real websites and applications to strengthen your frontend
              development abilities.
            </p>
          </div>

          {/* Project Categories */}
          <div className="space-y-16">
            {categories.map((category, categoryIndex) => (
              <div
                key={category.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${600 + categoryIndex * 200}ms` }}
              >
                <div className="flex items-center mb-8">
                  <span className="text-4xl mr-4">{category.icon}</span>
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">{category.title}</h2>
                    <p className="text-gray-400">{category.description}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {category.projects.map((project: any, projectIndex: number) => (
                    <Link
                      key={project.id}
                      href={`/projects/${category.id}/${project.id}`}
                      className={`block group bg-gradient-to-br from-gray-900/80 to-gray-800/40 rounded-xl p-6 border border-gray-700/50 hover:border-[#0fd8d7]/50 transition-all duration-500 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-[#0fd8d7]/20 backdrop-blur-sm animate-fade-in-up`}
                      style={{ animationDelay: `${800 + categoryIndex * 200 + projectIndex * 100}ms` }}
                    >
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(project.difficulty)}`}
                          >
                            {project.difficulty}
                          </span>
                          <div className="flex items-center text-gray-400">
                            <Clock className="w-4 h-4 mr-1" />
                            <span className="text-sm">{project.estimated_time}</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#0fd8d7] transition-colors duration-300">
                          {project.title}
                        </h3>
                        <p className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300 mb-4">
                          {project.description}
                        </p>
                      </div>

                      <div className="mb-4">
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech: string) => (
                            <span
                              key={tech}
                              className="px-2 py-1 bg-[#0fd8d7]/10 text-[#0fd8d7] rounded text-xs font-medium"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-gray-500">
                          <Code className="w-4 h-4 mr-1" />
                          <span className="text-sm">{project.requirements.length} Requirements</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {project.demo_url && (
                            <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-[#0fd8d7] transition-colors duration-300" />
                          )}
                          <Star className="w-4 h-4 text-gray-500 group-hover:text-[#0fd8d7] transition-colors duration-300" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
