import { supabase } from '../lib/supabase'
import { throwIf } from './supabase-helpers'

export const fallbackTopics = [
  'Life',
  'Culture',
  'Tech',
  'Travel',
  'Food',
  'Creativity',
  'Finance',
  'Wellness',
  'Books',
  'Community',
  'Sports',
  'Film',
  'History',
  'Society',
  'Music',
  'Politics',
  'Elections'
]

export async function listTopics() {
  const { data, error } = await supabase
    .from('blugbug_topics')
    .select('name')
    .eq('is_active', true)
    .order('name')
  throwIf(error)
  return (data || []).map((topic) => topic.name).filter(Boolean)
}
