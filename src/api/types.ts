export interface LocalUser {
  id: string
  username: string
  email: string
  full_name: string
  chatter_name: string
  about_me: string
  profile_image_url: string | null
  header_image_url: string | null
  role: 'user' | 'admin'
  recovery_status?: 'approved' | 'pending'
  recovery_requested_at?: string | null
  recovery_approved_at?: string | null
  created_at: string
  updated_at: string
}

export interface LocalPost {
  id: string
  user_id: string
  title: string
  content: string
  categories: string
  status: 'draft' | 'published'
  header_image_url?: string | null
  view_count: number
  created_at: string
  updated_at: string
  full_name?: string
  chatter_name?: string
  profile_image_url?: string | null
}
