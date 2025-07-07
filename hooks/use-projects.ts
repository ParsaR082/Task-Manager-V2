import { useQuery } from '@tanstack/react-query'
import { Project, ApiResponse } from '@/types'

// Fetch projects from API
const fetchProjects = async (): Promise<Project[]> => {
  const response = await fetch('/api/projects', {
    credentials: 'include',
  })
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
  }
  
  const data: ApiResponse<{ projects: Project[] }> = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch projects')
  }
  
  return data.data?.projects || []
}

// Custom hook for projects
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes (projects change less frequently)
  })
} 