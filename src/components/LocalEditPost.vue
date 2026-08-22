<template>
  <main class="edit-page">
    <NavBar />
    <PageColumns><form v-if="loaded" class="editor surface" @submit.prevent="save">
      <div class="editor-head">
        <div><span class="eyebrow">Make it sharper</span><h1>Edit your blug</h1></div>
        <div class="actions"><button class="ghost-button" type="button" @click="router.push('/myblug')">Cancel</button><button class="primary-button" :disabled="saving">{{ saving ? 'Saving…' : 'Save changes' }}</button></div>
      </div>
      <label>Title<input v-model="title" required placeholder="Give your blug a memorable title" /></label>
      <label>Category<input v-model="categories" placeholder="Life, culture, technology…" /></label>
      <label>Blug text<LocalEditor :initial-content="content" @updateContent="content = $event" @mediaAdded="pendingMedia.push($event)" /></label>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
    </form></PageColumns>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from './NavBar.vue';
import PageColumns from './PageColumns.vue';
import LocalEditor from './LocalEditor.vue';
import { getPost, updatePost } from '../api/posts';
import { pendingTokensInHtml, resolvePendingMedia, uploadPostMedia, type PendingInlineMedia } from '../api/uploads';

const route = useRoute();
const router = useRouter();
const loaded = ref(false);
const saving = ref(false);
const title = ref('');
const content = ref('');
const categories = ref('');
const pendingMedia = ref<PendingInlineMedia[]>([]);
const error = ref('');

onMounted(async () => {
  const { post } = await getPost(String(route.params.blogId));
  title.value = post.title;
  content.value = post.content;
  categories.value = post.categories;
  loaded.value = true;
});

const save = async () => {
  saving.value = true;
  try {
    const postId = String(route.params.blogId);
    const tokens = pendingTokensInHtml(content.value);
    const active = pendingMedia.value.filter((item) => tokens.has(item.token));
    const uploaded = new Map();
    for (const item of active) { const result = await uploadPostMedia(postId, item); uploaded.set(item.token, result.media); }
    const finalContent = resolvePendingMedia(content.value, uploaded);
    await updatePost(postId, { title: title.value, content: finalContent, categories: categories.value });
    active.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    await router.push('/myblug');
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Could not save this blug.';
  } finally { saving.value = false; }
};
</script>

<style scoped>
.edit-page { min-height: 100vh; padding: 112px 0 70px; }
.editor { width: 100%; margin: 0; padding: clamp(26px, 5vw, 56px); }
.editor-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 34px; }
h1 { margin: 8px 0 0; color: var(--ink); font-family: Georgia, serif; font-size: clamp(2.3rem, 5vw, 4.2rem); letter-spacing: -.055em; }
.actions { display: flex; gap: 10px; }
label { display: grid; gap: 8px; margin: 18px 0; color: var(--ink); font-size: .78rem; font-weight: 900; letter-spacing: .08em; text-transform: uppercase; }
input, textarea { padding: 15px 17px; border: 1px solid var(--line); border-radius: 14px; background: #fffdf8; color: var(--ink); font: inherit; text-transform: none; letter-spacing: normal; }
input:focus { border-color: var(--orange); outline: 3px solid color-mix(in srgb,var(--orange) 18%,transparent); }
.error{color:var(--orange);font-weight:700;text-transform:none;letter-spacing:normal}
@media (max-width: 680px) { .editor-head { display: grid; } .actions { order: 2; } }
</style>
