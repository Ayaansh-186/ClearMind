export type Cluster = 'work' | 'ideas' | 'personal' | 'learning' | 'health'

export type Note = {
  id: string
  user_id: string
  raw_content: string
  formatted_content: string | null
  title: string | null
  cluster: Cluster | null
  relevance: number
  image_url: string | null
  is_archived: boolean
  created_at: string
  updated_at: string
}

export const clusters: Cluster[] = ['work', 'ideas', 'personal', 'learning', 'health']

export const clusterColors: Record<string, { bg: string; text: string; dot: string }> = {
  work: { bg: '#EEEDFE', text: '#534AB7', dot: '#7F77DD' },
  ideas: { bg: '#E1F5EE', text: '#0F6E56', dot: '#1D9E75' },
  personal: { bg: '#FAECE7', text: '#993C1D', dot: '#D85A30' },
  learning: { bg: '#E6F1FB', text: '#185FA5', dot: '#378ADD' },
  health: { bg: '#EAF3DE', text: '#3B6D11', dot: '#639922' },
}
