const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://45.153.69.118:5000"

// Type definitions matching C# DTOs
export interface ProjectTaskDto {
    id: string
    name: string
    result: string
    deadline: string
    isCompleted: boolean
    projectId: string
    responsibleStudentId: string
    prerequisites: string[]
    dependentTaskId: string | null
}

export interface ProjectDto {
    id: string
    name: string
    description: string
    deadline: string
    tasks: string[]
    members: string[]
    subjectName: string
    creatorId: string
}

export interface StudentDto {
    id: string
    firstName: string
    lastName: string
    email: string
    projectId: string | null
    projectTaskIds: string[]
}

export interface SubjectDto {
    id: string
    name: string
}

// API Client
class ApiClient {
    private baseUrl: string

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`
        const config: RequestInit = {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            credentials: "include",
        }

        const response = await fetch(url, config)

        if(response.status === 401) {
            window.location.href = "/auth/login"
            return {} as T
        }
        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }

        // For 204 No Content responses
        if (response.status === 204) {
            return {} as T
        }

        const text = await response.text()
        if (!text) {
            return {} as T
        }

        return JSON.parse(text) as T
    }

    // Students endpoints
    async registerStudent(data: {
        firstName: string
        lastName: string
        email: string
        password: string
    }): Promise<StudentDto> {
        return this.request("/api/students/register", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }

    async loginStudent(data: {
        email: string
        password: string
    }): Promise<StudentDto> {
        return this.request("/api/students/login", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }

    async getCurrentStudent(): Promise<StudentDto> {
        return this.request("/api/students/me", {
            method: "GET",
        })
    }

    async getStudents(): Promise<StudentDto> {
        return this.request("/api/students/get", {
            method: "GET",
        })
    }

    async getStudentById(studentId: string): Promise<StudentDto> {
        return this.request(`/api/students/get/${studentId}`, {
            method: "GET",
        })
    }

    async getStudentByEmail(studentId: string): Promise<StudentDto> {
        return this.request(`/api/students/get/email/${studentId}`, {
            method: "GET",
        })
    }

    async inviteStudent(data: { email: string; projectId: string; studentId: string }): Promise<void> {
        return this.request("/api/students/invite", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }

    async acceptInvite(studentId: string, projectId: string): Promise<void> {
        return this.request(`/api/students/accept-invite/${studentId}/${projectId}`, {
            method: "GET",
        })
    }

    // Projects endpoints
    async createProject(data: {
        name: string,
        creatorId: string,
        description: string
        deadline: string
        subjectName: string
    }): Promise<ProjectDto> {
        return this.request("/api/projects", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }

    async getProject(projectId: string): Promise<ProjectDto> {
        return this.request(`/api/projects/${projectId}`, {
            method: "GET",
        })
    }

    async getAllProjects(): Promise<ProjectDto[]> {
        return this.request("/api/projects/all", {
            method: "GET",
        })
    }

    async deleteProject(projectId: string): Promise<void> {
        return this.request("/api/projects", {
            method: "DELETE",
            body: JSON.stringify({ id: projectId }),
        })
    }

    async createTask(data: {
        name: string
        result: string
        deadline: string
        projectId: string
        responsibleStudentId: string
        dependentTaskId?: string | null
    }): Promise<ProjectTaskDto> {
        return this.request("/api/projects/task", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }

    async getProjectTasks(projectId: string): Promise<ProjectTaskDto[]> {
        return this.request(`/api/project-tasks/${projectId}`, {
            method: "GET",
        })
    }


    async updateTask(taskId: string, data: Partial<ProjectTaskDto>): Promise<ProjectTaskDto> {
        return this.request(`/api/project-tasks/${taskId}`, {
            method: "PUT",
            body: JSON.stringify(data),
        })
    }

    async patchTask(taskId: string, data: Partial<ProjectTaskDto>): Promise<ProjectTaskDto> {
        return this.request("/api/project-tasks", {
            method: "PATCH",
            body: JSON.stringify({ id: taskId, ...data }),
        })
    }

    async deleteTask(taskId: string): Promise<void> {
        return this.request(`/api/project-tasks/${taskId}`, {
            method: "DELETE",
        })
    }

    // Subjects endpoints
    async createSubject(data: { name: string }): Promise<SubjectDto> {
        return this.request("/api/subjects", {
            method: "POST",
            body: JSON.stringify(data),
        })
    }

    async getSubjects(): Promise<SubjectDto[]> {
        return this.request("/api/subjects", {
            method: "GET",
        })
    }

    async getAllSubjects(): Promise<SubjectDto[]> {
        return this.request("/api/subjects/all", {
            method: "GET",
        })
    }

    async updateSubject(data: { id: string; name: string }): Promise<SubjectDto> {
        return this.request("/api/subjects", {
            method: "PATCH",
            body: JSON.stringify(data),
        })
    }

    async deleteSubject(subjectId: string): Promise<void> {
        return this.request("/api/subjects", {
            method: "DELETE",
            body: JSON.stringify({ id: subjectId }),
        })
    }
}

export const apiClient = new ApiClient(API_BASE_URL)
