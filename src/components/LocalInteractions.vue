<template>
  <section class="interactions">
    <h2>Join the conversation</h2>
    <div class="actions">
      <button :class="{ active: state.liked }" :aria-pressed="state.liked" @click="toggle('likes')">
        ♥ {{ state.liked ? 'Liked' : 'Like' }} · {{ state.likes }}
      </button>
      <button
        :class="{ active: state.bookmarked }"
        :aria-pressed="state.bookmarked"
        @click="toggle('bookmarks')"
      >
        ⌑ {{ state.bookmarked ? 'Saved' : 'Save' }} · {{ state.bookmarks }}
      </button>
      <button @click="share">↗ {{ shareLabel }}</button>
      <button :class="{ active: quoteMode || selectedQuote }" @click="$emit('request-quote')">
        ❝ Quote
      </button>
    </div>
    <label v-if="!authStore.isAuthenticated.value" class="guest-name"
      >Guest display name<input
        v-model.trim="guestName"
        maxlength="40"
        placeholder="Choose a guest name"
    /></label>
    <section v-if="selectedQuote" class="quote-composer">
      <header>
        <span>Quoted from this blug</span
        ><button type="button" aria-label="Remove quote" @click="$emit('clear-quote')">×</button>
      </header>
      <blockquote>“{{ selectedQuote }}”</blockquote>
      <p>Add your opinion below.</p>
    </section>
    <p v-else-if="quoteMode" class="selection-note">Highlight the passage you want to quote.</p>
    <form aria-label="Add a comment" @submit.prevent="submitComment">
      <label class="sr-only" for="new-comment">Write a comment</label
      ><input
        id="new-comment"
        v-model="commentBody"
        maxlength="2000"
        :placeholder="selectedQuote ? 'Write your opinion about this quote' : 'Write a comment'"
      /><button
        :disabled="
          !commentBody.trim() || (!authStore.isAuthenticated.value && guestName.length < 2)
        "
      >
        {{ selectedQuote ? 'Post opinion' : 'Comment' }}
      </button>
    </form>
    <article v-for="comment in comments" :key="comment.id" class="comment">
      <button
        class="comment-author"
        type="button"
        :disabled="!comment.user_id"
        @click="openProfile(comment.user_id)"
      >
        <strong>{{ comment.user_id ? '@' : '' }}{{ comment.chatter_name }}</strong
        ><small v-if="!comment.user_id"> · Guest</small>
      </button>
      <blockquote v-if="comment.quote_text" class="comment-quote">
        “{{ comment.quote_text }}”
      </blockquote>
      <p>{{ comment.body }}</p>
      <button v-if="comment.user_id === currentUserId" @click="removeComment(comment.id)">
        Delete
      </button>
      <div v-for="reply in comment.replies" :key="reply.id" class="reply">
        <button
          class="comment-author"
          type="button"
          :disabled="!reply.user_id"
          @click="openProfile(reply.user_id)"
        >
          <strong>{{ reply.user_id ? '@' : '' }}{{ reply.chatter_name }}</strong
          ><small v-if="!reply.user_id"> · Guest</small>
        </button>
        {{ reply.body }}
      </div>
      <form
        :aria-label="`Reply to ${comment.chatter_name}`"
        @submit.prevent="submitReply(comment.id)"
      >
        <label class="sr-only" :for="`reply-${comment.id}`"
          >Reply to {{ comment.chatter_name }}</label
        ><input
          :id="`reply-${comment.id}`"
          v-model="replyDrafts[comment.id]"
          maxlength="2000"
          placeholder="Write a reply"
        /><button :disabled="!replyDrafts[comment.id]?.trim()">Reply</button>
      </form>
    </article>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authStore } from '../stores/auth'
import {
  addComment,
  addGuestComment,
  addGuestReply,
  addReply,
  deleteComment,
  getInteractions,
  listComments,
  setInteraction,
  type Comment,
  type Interactions
} from '../api/social'
const props = defineProps<{
  postId: string
  shareVersion?: string
  selectedQuote?: string
  quoteMode?: boolean
}>()
const emit = defineEmits<{ (event: 'request-quote'): void; (event: 'clear-quote'): void }>()
const state = reactive<Interactions>({ likes: 0, bookmarks: 0, liked: false, bookmarked: false })
const comments = ref<Comment[]>([])
const commentBody = ref('')
const guestName = ref(sessionStorage.getItem('blugbug-guest-name') || '')
const replyDrafts = reactive<Record<string, string>>({})
const shareLabel = ref('Share')
const currentUserId = authStore.user.value?.id
const router = useRouter()
const openProfile = (userId: string | null) => userId && router.push(`/user/${userId}`)
const guestToken = async () => {
  let token = localStorage.getItem('blugbug-guest-token')
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem('blugbug-guest-token', token)
  }
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token))
  return [...new Uint8Array(bytes)].map((x) => x.toString(16).padStart(2, '0')).join('')
}
const load = async () => {
  Object.assign(state, await getInteractions(props.postId))
  comments.value = (await listComments(props.postId)).comments
}
const toggle = async (type: 'likes' | 'bookmarks') => {
  if (!authStore.isAuthenticated.value) {
    window.dispatchEvent(new CustomEvent('blugbug:auth-required'))
    return
  }
  const key = type === 'likes' ? 'liked' : 'bookmarked'
  await setInteraction(props.postId, type, !state[key])
  await load()
}
const submitComment = async () => {
  if (!commentBody.value.trim()) return
  if (authStore.isAuthenticated.value)
    await addComment(props.postId, commentBody.value, props.selectedQuote)
  else {
    sessionStorage.setItem('blugbug-guest-name', guestName.value)
    await addGuestComment(
      props.postId,
      commentBody.value,
      guestName.value,
      await guestToken(),
      props.selectedQuote
    )
  }
  commentBody.value = ''
  emit('clear-quote')
  await load()
}
const submitReply = async (id: string) => {
  const body = replyDrafts[id]?.trim()
  if (!body) return
  if (authStore.isAuthenticated.value) await addReply(id, body)
  else {
    sessionStorage.setItem('blugbug-guest-name', guestName.value)
    await addGuestReply(id, body, guestName.value, await guestToken())
  }
  replyDrafts[id] = ''
  await load()
}
const removeComment = async (id: string) => {
  await deleteComment(id)
  await load()
}
const share = async () => {
  const version = encodeURIComponent(props.shareVersion || String(Date.now()))
  const url = `${window.location.origin}/blug/${encodeURIComponent(props.postId)}?v=${version}`
  if (navigator.share) {
    try {
      await navigator.share({ title: document.title, url })
      return
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return
    }
  }
  await navigator.clipboard.writeText(url)
  shareLabel.value = 'Copied'
  window.setTimeout(() => {
    shareLabel.value = 'Share'
  }, 1800)
}
watch(() => props.postId, load, { immediate: true })
</script>

<style scoped>
.interactions {
  box-sizing: border-box;
  width: 100%;
  padding: 32px 24px 0;
  color: var(--cream);
  border-top: 1px solid var(--line);
}
.interactions h2 {
  margin: 0 0 8px;
  color: var(--cream);
  font:
    700 1.45rem Georgia,
    serif;
}
.actions,
form {
  display: flex;
  gap: 10px;
  margin: 14px 0 24px;
}
button {
  min-height: 44px;
  padding: 10px 16px;
  border: 1px solid #59616d;
  border-radius: 999px;
  background: #181b21;
  color: var(--cream);
  font-weight: 800;
  cursor: pointer;
}
button:hover,
button.active,
form > button {
  border-color: var(--orange);
  background: var(--orange);
  color: white;
}
button:disabled {
  border-color: var(--line);
  background: #252931;
  color: #8f959e;
  cursor: not-allowed;
}
input {
  flex: 1;
  min-width: 0;
  padding: 12px 15px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: #fffdf8;
  color: var(--ink);
  font: inherit;
}
.guest-name {
  display: grid;
  gap: 7px;
  max-width: 360px;
  margin-top: 18px;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 800;
}
.guest-name input {
  width: 100%;
  box-sizing: border-box;
}
.selection-note {
  margin: 18px 0 8px;
  padding: 12px 14px;
  border-left: 3px solid var(--orange);
  background: var(--soft);
  color: var(--text);
}
.quote-composer {
  margin-top: 18px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--panel);
}
.quote-composer header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--orange);
  font-size: 0.72rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.quote-composer header button {
  min-height: 30px;
  padding: 0 9px;
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 1.2rem;
}
.quote-composer blockquote,
.comment-quote {
  margin: 12px 0;
  padding: 10px 14px;
  border-left: 3px solid var(--orange);
  background: var(--soft);
  color: var(--text);
  font:
    italic 1rem/1.55 Georgia,
    serif;
}
.quote-composer > p {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 0.78rem;
}
.comment-quote {
  font-size: 0.95rem;
}
.comment {
  border-top: 1px solid var(--line);
  padding: 22px 0;
}
.comment p {
  line-height: 1.65;
}
.comment > button {
  padding: 5px 10px;
  color: var(--muted);
  font-size: 0.72rem;
}
.reply {
  margin: 12px 0 12px 24px;
  padding: 12px 16px;
  border-left: 2px solid var(--orange);
  color: var(--muted);
}
.comment-author {
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: none !important;
  color: inherit !important;
  cursor: pointer;
}
.comment-author:hover strong {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 560px) {
  .interactions {
    padding: 28px 16px 0;
  }
  .actions {
    flex-wrap: wrap;
  }
  form {
    align-items: stretch;
  }
}
</style>
