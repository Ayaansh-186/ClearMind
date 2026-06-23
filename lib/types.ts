export type Cluster = 'work' | 'ideas' | 'personal' | 'learning' | 'health'

export type Tag = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
  note_count?: number   // populated only by GET /api/tags
}

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
  is_pinned: boolean
  is_shared?: boolean
  share_id?: string | null
  is_discover?: boolean          // opted into the community Discover feed
  created_at: string
  updated_at: string
  tags?: Tag[]
  // Populated in discover feed responses
  author_name?: string | null
  reaction_count?: number
}

export const clusters: Cluster[] = ['work', 'ideas', 'personal', 'learning', 'health']

export const clusterColors: Record<string, { bg: string; text: string; dot: string }> = {
  work:     { bg: '#EEEDFE', text: '#534AB7', dot: '#7F77DD' },
  ideas:    { bg: '#E1F5EE', text: '#0F6E56', dot: '#1D9E75' },
  personal: { bg: '#FAECE7', text: '#993C1D', dot: '#D85A30' },
  learning: { bg: '#E6F1FB', text: '#185FA5', dot: '#378ADD' },
  health:   { bg: '#EAF3DE', text: '#3B6D11', dot: '#639922' },
}

// Default palette offered when creating a new tag
export const TAG_COLORS = [
  '#6366F1', '#EC4899', '#F59E0B', '#10B981',
  '#EF4444', '#A855F7', '#0EA5E9', '#84CC16',
]
