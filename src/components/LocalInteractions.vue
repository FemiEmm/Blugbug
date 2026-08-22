<template>
  <section class="interactions">
    <h2>Join the conversation</h2>
    <div class="actions">
      <button :class="{ active: state.liked }" :aria-pressed="state.liked" @click="toggle('likes')">♥ {{ state.liked ? 'Liked' : 'Like' }} · {{ state.likes }}</button>
      <button :class="{ active: state.bookmarked }" :aria-pressed="state.bookmarked" @click="toggle('bookmarks')">⌑ {{ state.bookmarked ? 'Saved' : 'Save' }} · {{ state.bookmarks }}</button>
      <button @click="share">↗ {{ shareLabel }}</button>
    </div>
    <form aria-label="Add a comment" @submit.prevent="submitComment"><label class="sr-only" for="new-comment">Write a comment</label><input id="new-comment" v-model="commentBody" maxlength="2000" placeholder="Write a comment" /><button :disabled="!commentBody.trim()">Comment</button></form>
    <article v-for="comment in comments" :key="comment.id" class="comment">
      <button class="comment-author" type="button" @click="openProfile(comment.user_id)"><strong>@{{ comment.chatter_name }}</strong></button><p>{{ comment.body }}</p>
      <button v-if="comment.user_id === currentUserId" @click="removeComment(comment.id)">Delete</button>
      <div v-for="reply in comment.replies" :key="reply.id" class="reply"><button class="comment-author" type="button" @click="openProfile(reply.user_id)"><strong>@{{ reply.chatter_name }}</strong></button> {{ reply.body }}</div>
      <form :aria-label="`Reply to ${comment.chatter_name}`" @submit.prevent="submitReply(comment.id)"><label class="sr-only" :for="`reply-${comment.id}`">Reply to {{ comment.chatter_name }}</label><input :id="`reply-${comment.id}`" v-model="replyDrafts[comment.id]" maxlength="2000" placeholder="Write a reply" /><button :disabled="!replyDrafts[comment.id]?.trim()">Reply</button></form>
    </article>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { authStore } from '../stores/auth';
import { addComment, addReply, deleteComment, getInteractions, listComments, setInteraction, type Comment, type Interactions } from '../api/social';
const props = defineProps<{ postId: string }>();
const state = reactive<Interactions>({ likes: 0, bookmarks: 0, liked: false, bookmarked: false });
const comments = ref<Comment[]>([]);
const commentBody = ref('');
const replyDrafts = reactive<Record<string, string>>({});
const shareLabel = ref('Share');
const currentUserId = authStore.user.value?.id;
const router = useRouter();
const openProfile = (userId: string) => router.push(`/user/${userId}`);
const load = async () => { Object.assign(state, await getInteractions(props.postId)); comments.value = (await listComments(props.postId)).comments; };
const toggle = async (type: 'likes' | 'bookmarks') => { const key = type === 'likes' ? 'liked' : 'bookmarked'; await setInteraction(props.postId, type, !state[key]); await load(); };
const submitComment = async () => { if (!commentBody.value.trim()) return; await addComment(props.postId, commentBody.value); commentBody.value = ''; await load(); };
const submitReply = async (id: string) => { const body = replyDrafts[id]?.trim(); if (!body) return; await addReply(id, body); replyDrafts[id] = ''; await load(); };
const removeComment = async (id: string) => { await deleteComment(id); await load(); };
const share = async () => {
  const url = `${window.location.origin}/blug/${encodeURIComponent(props.postId)}`;
  if (navigator.share) {
    try { await navigator.share({ title: document.title, url }); return; } catch (error) { if ((error as DOMException).name === 'AbortError') return; }
  }
  await navigator.clipboard.writeText(url);
  shareLabel.value = 'Copied';
  window.setTimeout(() => { shareLabel.value = 'Share'; }, 1800);
};
watch(() => props.postId, load, { immediate: true });
</script>

<style scoped>
.interactions { box-sizing: border-box; width: 100%; padding: 32px 24px 0; color: var(--cream); border-top: 1px solid var(--line); }
.interactions h2 { margin: 0 0 8px; color: var(--cream); font: 700 1.45rem Georgia, serif; }
.actions, form { display: flex; gap: 10px; margin: 14px 0 24px; }
button { min-height: 44px; padding: 10px 16px; border: 1px solid #59616d; border-radius: 999px; background: #181b21; color: var(--cream); font-weight: 800; cursor: pointer; }
button:hover, button.active, form > button { border-color: var(--orange); background: var(--orange); color: white; }
button:disabled { border-color: var(--line); background: #252931; color: #8f959e; cursor: not-allowed; }
input { flex: 1; min-width: 0; padding: 12px 15px; border-radius: 14px; border: 1px solid var(--line); background: #fffdf8; color: var(--ink); font: inherit; }
.comment { border-top: 1px solid var(--line); padding: 22px 0; }
.comment p { line-height: 1.65; }
.comment > button { padding: 5px 10px; color: var(--muted); font-size: .72rem; }
.reply { margin: 12px 0 12px 24px; padding: 12px 16px; border-left: 2px solid var(--orange); color: var(--muted); }
.comment-author { min-height: 0; padding: 0; border: 0; border-radius: 0; background: none!important; color: inherit!important; cursor: pointer; }
.comment-author:hover strong { text-decoration: underline; text-underline-offset: 3px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 560px) {
  .interactions { padding: 28px 16px 0; }
  .actions { flex-wrap: wrap; }
  form { align-items: stretch; }
}
</style>
