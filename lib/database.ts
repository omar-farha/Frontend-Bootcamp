import { supabase } from "./supabase"
import type {
  AccessCode,
  UserProgress,
  Course,
  Session,
  ProjectCategory,
  Project,
  ProjectProgress,
  SessionProgress,
} from "./supabase"

// Supabase service functions
const supabaseService = {
  accessCodes: {
    async getAll(): Promise<AccessCode[]> {
      const { data, error } = await supabase.from("access_codes").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return data || []
    },

    async create(accessCode: Omit<AccessCode, "id" | "created_at">): Promise<AccessCode> {
      const { data, error } = await supabase.from("access_codes").insert(accessCode).select().single()
      if (error) throw error
      return data
    },

    async update(id: string, updates: Partial<AccessCode>): Promise<AccessCode> {
      const { data, error } = await supabase.from("access_codes").update(updates).eq("id", id).select().single()
      if (error) throw error
      return data
    },

    async delete(id: string): Promise<void> {
      const { error } = await supabase.from("access_codes").delete().eq("id", id)
      if (error) throw error
    },

    async findByCode(code: string): Promise<AccessCode | null> {
      const { data, error } = await supabase.from("access_codes").select("*").eq("code", code).single()
      if (error && error.code !== "PGRST116") throw error
      return data || null
    },
  },

  userProgress: {
    async getAll(): Promise<UserProgress[]> {
      const { data, error } = await supabase
        .from("user_progress")
        .select("*")
        .order("last_activity", { ascending: false })
      if (error) throw error
      return data || []
    },

    async findByUserCode(userCode: string): Promise<UserProgress | null> {
      const { data, error } = await supabase.from("user_progress").select("*").eq("user_code", userCode).single()
      if (error && error.code !== "PGRST116") throw error
      return data || null
    },

    async upsert(progress: Omit<UserProgress, "id" | "created_at" | "updated_at">): Promise<UserProgress> {
      const { data, error } = await supabase
        .from("user_progress")
        .upsert(progress, { onConflict: "user_code" })
        .select()
        .single()
      if (error) throw error
      return data
    },

    async updateLoginCount(userCode: string): Promise<void> {
      const { error } = await supabase.rpc("increment_login_count", {
        user_code: userCode,
      })
      if (error) throw error
    },
  },

  courses: {
    async getAll(): Promise<Course[]> {
      const { data: courses, error: coursesError } = await supabase.from("courses").select("*").order("created_at")
      if (coursesError) throw coursesError

      const { data: sessions, error: sessionsError } = await supabase.from("sessions").select("*").order("order_index")
      if (sessionsError) throw sessionsError

      const coursesWithSessions =
        courses?.map((course) => ({
          ...course,
          sessions: sessions?.filter((session) => session.course_id === course.id) || [],
        })) || []

      return coursesWithSessions
    },

    async update(courseId: string, updates: Partial<Course>): Promise<Course> {
      const { data, error } = await supabase.from("courses").update(updates).eq("id", courseId).select().single()
      if (error) throw error
      return data
    },

    async updateSession(courseId: string, sessionId: string, updates: Partial<Session>): Promise<Session> {
      const { data, error } = await supabase
        .from("sessions")
        .update(updates)
        .eq("course_id", courseId)
        .eq("id", sessionId)
        .select()
        .single()
      if (error) throw error
      return data
    },
  },

  projects: {
    async getAll(): Promise<ProjectCategory[]> {
      const { data: categories, error: categoriesError } = await supabase
        .from("project_categories")
        .select("*")
        .order("created_at")
      if (categoriesError) throw categoriesError

      const { data: projects, error: projectsError } = await supabase.from("projects").select("*").order("created_at")
      if (projectsError) throw projectsError

      const categoriesWithProjects =
        categories?.map((category) => ({
          ...category,
          projects: projects?.filter((project) => project.category_id === category.id) || [],
        })) || []

      return categoriesWithProjects
    },

    async updateCategory(categoryId: string, updates: Partial<ProjectCategory>): Promise<ProjectCategory> {
      const { data, error } = await supabase
        .from("project_categories")
        .update(updates)
        .eq("id", categoryId)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async updateProject(categoryId: string, projectId: string, updates: Partial<Project>): Promise<Project> {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("category_id", categoryId)
        .eq("id", projectId)
        .select()
        .single()
      if (error) throw error
      return data
    },

    async createProject(project: Omit<Project, "created_at" | "updated_at">): Promise<Project> {
      const { data, error } = await supabase.from("projects").insert(project).select().single()
      if (error) throw error
      return data
    },

    async deleteProject(categoryId: string, projectId: string): Promise<void> {
      const { error } = await supabase.from("projects").delete().eq("category_id", categoryId).eq("id", projectId)
      if (error) throw error
    },
  },

  sessionProgress: {
    async findByUser(userCode: string): Promise<SessionProgress[]> {
      const { data, error } = await supabase.from("session_progress").select("*").eq("user_code", userCode)
      if (error) throw error
      return data || []
    },

    async upsert(progress: Omit<SessionProgress, "id" | "created_at" | "updated_at">): Promise<SessionProgress> {
      const { data, error } = await supabase
        .from("session_progress")
        .upsert(progress, { onConflict: "user_code,course_id,session_id" })
        .select()
        .single()
      if (error) throw error
      return data
    },

    async findByUserAndSession(userCode: string, courseId: string, sessionId: string): Promise<SessionProgress | null> {
      const { data, error } = await supabase
        .from("session_progress")
        .select("*")
        .eq("user_code", userCode)
        .eq("course_id", courseId)
        .eq("session_id", sessionId)
        .single()
      if (error && error.code !== "PGRST116") throw error
      return data || null
    },
  },

  projectProgress: {
    async findByUser(userCode: string): Promise<ProjectProgress[]> {
      const { data, error } = await supabase.from("project_progress").select("*").eq("user_code", userCode)
      if (error) throw error
      return data || []
    },

    async upsert(progress: Omit<ProjectProgress, "id" | "created_at" | "updated_at">): Promise<ProjectProgress> {
      const { data, error } = await supabase
        .from("project_progress")
        .upsert(progress, { onConflict: "user_code,project_id,category_id" })
        .select()
        .single()
      if (error) throw error
      return data
    },

    async findByUserAndProject(
      userCode: string,
      categoryId: string,
      projectId: string,
    ): Promise<ProjectProgress | null> {
      const { data, error } = await supabase
        .from("project_progress")
        .select("*")
        .eq("user_code", userCode)
        .eq("category_id", categoryId)
        .eq("project_id", projectId)
        .single()
      if (error && error.code !== "PGRST116") throw error
      return data || null
    },
  },
}

// Export the Supabase service as the default database service
export const accessCodeService = supabaseService.accessCodes
export const userProgressService = supabaseService.userProgress
export const courseService = supabaseService.courses
export const projectService = supabaseService.projects
export const sessionProgressService = supabaseService.sessionProgress
export const projectProgressService = supabaseService.projectProgress

// Export configuration status
export const isSupabaseConfigured = () => {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
