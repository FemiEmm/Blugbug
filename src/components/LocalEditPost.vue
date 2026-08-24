<template>
  <main class="edit-page">
    <NavBar />
    <PageColumns
      ><form v-if="loaded" class="editor surface" @submit.prevent="save">
        <div class="editor-head">
          <div>
            <span class="eyebrow">Make it sharper</span>
            <h1>Edit your blug</h1>
          </div>
          <div class="actions">
            <button class="ghost-button" type="button" @click="router.push('/myblug')">
              Cancel</button
            ><button class="primary-button" :disabled="saving">
              {{ saving ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </div>
        <label
          >Title<input v-model="title" required placeholder="Give your blug a memorable title"
        /></label>
        <label
          >Topic<select v-model="categories" required>
            <option value="" disabled>Choose topic</option>
            <option v-for="topic in topics" :key="topic" :value="topic">{{ topic }}</option>
          </select></label
        >
        <label
          >Blug text<LocalEditor
            :initial-content="content"
            @updateContent="content = $event"
            @mediaAdded="pendingMedia.push($event)"
        /></label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </form></PageColumns
    >
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NavBar from './NavBar.vue'
import PageColumns from './PageColumns.vue'
import LocalEditor from './LocalEditor.vue'
import { getPost, updatePost } from '../api/posts'
import {
  pendingTokensInHtml,
  resolvePendingMedia,
  uploadPostMedia,
  type PendingInlineMedia
} from '../api/uploads'
import { fallbackTopics, listTopics } from '../api/topics'

const route = useRoute()
const router = useRouter()
const loaded = ref(false)
const saving = ref(false)
const title = ref('')
const content = ref('')
const categories = ref('')
const pendingMedia = ref<PendingInlineMedia[]>([])
const error = ref('')
const topics = ref([...fallbackTopics])

onMounted(async () => {
  try {
    topics.value = await listTopics()
  } catch {
    topics.value = [...fallbackTopics]
  }
  const { post } = await getPost(String(route.params.blogId))
  title.value = post.title
  content.value = post.content
  categories.value = post.categories
  loaded.value = true
})

const save = async () => {
  saving.value = true
  try {
    const postId = String(route.params.blogId)
    const tokens = pendingTokensInHtml(content.value)
    const active = pendingMedia.value.filter((item) => tokens.has(item.token))
    const uploaded = new Map()
    for (const item of active) {
      const result = await uploadPostMedia(postId, item)
      uploaded.set(item.token, result.media)
    }
    const finalContent = resolvePendingMedia(content.value, uploaded)
    await updatePost(postId, {
      title: title.value,
      content: finalContent,
      categories: categories.value
    })
    active.forEach((item) => URL.revokeObjectURL(item.previewUrl))
    await router.push('/myblug')
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not save this blug.'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.edit-page {
  min-height: 100vh;
  padding: 112px 0 70px;
}
.editor {
  width: 100%;
  margin: 0;
  padding: clamp(26px, 5vw, 56px);
}
.editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 34px;
}
h1 {
  margin: 8px 0 0;
  color: var(--ink);
  font-family: Georgia, serif;
  font-size: clamp(2.3rem, 5vw, 4.2rem);
  letter-spacing: -0.055em;
}
.actions {
  display: flex;
  gap: 10px;
}
label {
  display: grid;
  gap: 8px;
  margin: 18px 0;
  color: var(--ink);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
input,
textarea,
select {
  padding: 15px 17px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--input);
  color: var(--text);
  font: inherit;
  text-transform: none;
  letter-spacing: normal;
}
select {
  appearance: none;
  padding-right: 42px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='m1 1 5 5 5-5' fill='none' stroke='%23645d55' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 12px 8px;
}
input:focus {
  border-color: var(--orange);
  outline: 3px solid color-mix(in srgb, var(--orange) 18%, transparent);
}
.error {
  color: var(--orange);
  font-weight: 700;
  text-transform: none;
  letter-spacing: normal;
}
@media (max-width: 680px) {
  .editor-head {
    display: grid;
  }
  .actions {
    order: 2;
  }
}
</style>
