<template>
  <div class="editor">
    <div class="toolbar" role="toolbar" aria-label="Blug formatting">
      <button type="button" aria-label="Bold" @mousedown.prevent="rememberSelection" @click="format('bold')"><b aria-hidden="true">B</b></button>
      <button type="button" aria-label="Italic" @mousedown.prevent="rememberSelection" @click="format('italic')"><i aria-hidden="true">I</i></button>
      <button type="button" aria-label="Bulleted list" @mousedown.prevent="rememberSelection" @click="format('insertUnorderedList')">List</button>
      <label class="image-button" @mousedown="rememberSelection"><span aria-hidden="true">▧</span> Image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="chooseImage" /></label>
    </div>
    <div v-if="imageDraft" class="image-panel">
      <img :src="imageDraft.previewUrl" alt="Selected image preview" />
      <div>
        <label>Describe the image <span aria-hidden="true">*</span><input v-model.trim="imageDraft.altText" maxlength="300" placeholder="What is visible in this image?" /></label>
        <label>Caption <small>(optional)</small><input v-model.trim="imageDraft.caption" maxlength="500" placeholder="Add context or credit" /></label>
        <p v-if="imageError" role="alert">{{ imageError }}</p>
        <div class="image-actions"><button type="button" @click="cancelImage">Cancel</button><button type="button" class="insert" @click="insertImage">Insert here</button></div>
      </div>
    </div>
    <div ref="surface" class="surface" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Blug content" tabindex="0" @input="emitContent" @keyup="rememberSelection" @mouseup="rememberSelection"></div>
    <p class="image-help">Images can sit between paragraphs. Every image requires a description for screen readers.</p>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import type { PendingInlineMedia } from '../api/uploads';
const props = defineProps<{ initialContent?: string }>();
const emit = defineEmits<{ updateContent: [content: string]; mediaAdded: [media: PendingInlineMedia] }>();
const surface = ref<HTMLElement | null>(null);
const imageDraft = ref<PendingInlineMedia | null>(null);
const imageError = ref('');
let savedRange: Range | null = null;
const sync = () => nextTick(() => { if (surface.value && surface.value.innerHTML !== props.initialContent) surface.value.innerHTML = props.initialContent || ''; });
onMounted(sync); watch(() => props.initialContent, sync);
onBeforeUnmount(() => { if (imageDraft.value) URL.revokeObjectURL(imageDraft.value.previewUrl); });
const emitContent = () => emit('updateContent', surface.value?.innerHTML || '');
const rememberSelection = () => { const selection = window.getSelection(); if (!selection?.rangeCount || !surface.value) return; const range = selection.getRangeAt(0); if (surface.value.contains(range.commonAncestorContainer)) savedRange = range.cloneRange(); };
const restoreSelection = () => { if (!surface.value) return; surface.value.focus(); const selection = window.getSelection(); selection?.removeAllRanges(); if (savedRange) selection?.addRange(savedRange); else { const range = document.createRange(); range.selectNodeContents(surface.value); range.collapse(false); selection?.addRange(range); } };
const format = (command: string) => { restoreSelection(); document.execCommand(command); rememberSelection(); emitContent(); };
const chooseImage = (event: Event) => {
  const input = event.target as HTMLInputElement; const file = input.files?.[0]; input.value = ''; if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { imageError.value = 'Choose a JPG, PNG, WebP, or GIF image.'; return; }
  if (file.size > 5 * 1024 * 1024) { imageError.value = 'Inline images must be 5 MB or smaller.'; return; }
  if (imageDraft.value) URL.revokeObjectURL(imageDraft.value.previewUrl);
  imageDraft.value = reactive({ token: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), altText: '', caption: '' }); imageError.value = '';
};
const cancelImage = () => { if (imageDraft.value) URL.revokeObjectURL(imageDraft.value.previewUrl); imageDraft.value = null; imageError.value = ''; };
const insertImage = () => {
  const pending = imageDraft.value; if (!pending?.altText.trim()) { imageError.value = 'Describe the image before inserting it.'; return; }
  restoreSelection(); const figure = document.createElement('figure'); figure.dataset.uploadToken = pending.token; figure.contentEditable = 'false';
  const image = document.createElement('img'); image.src = pending.previewUrl; image.alt = pending.altText; figure.appendChild(image);
  if (pending.caption) { const caption = document.createElement('figcaption'); caption.textContent = pending.caption; figure.appendChild(caption); }
  const selection = window.getSelection(); const range = selection?.rangeCount ? selection.getRangeAt(0) : null; range?.deleteContents(); range?.insertNode(figure); figure.insertAdjacentHTML('afterend', '<p><br></p>');
  emit('mediaAdded', { ...pending }); imageDraft.value = null; savedRange = null; emitContent();
};
</script>

<style scoped>
.editor{overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--input);color:var(--text)}.toolbar{display:flex;flex-wrap:wrap;gap:6px;padding:9px 11px;border-bottom:1px solid var(--line);background:var(--surface)}.toolbar button,.image-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:7px 11px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);font:700 .78rem/1 Inter,sans-serif;cursor:pointer}.toolbar button:hover,.toolbar button:focus-visible,.image-button:hover,.image-button:focus-within{border-color:var(--orange);color:var(--orange)}.surface{min-height:270px;padding:18px;outline:none;line-height:1.75}.surface:focus{box-shadow:inset 3px 0 var(--orange)}.surface :deep(figure){margin:24px 0;padding:0}.surface :deep(img){display:block;width:100%;max-height:520px;border-radius:12px;object-fit:contain;background:var(--surface)}.surface :deep(figcaption){padding:8px 4px 0;color:var(--muted);font-size:.8rem;text-align:center}.image-panel{display:grid;grid-template-columns:150px 1fr;gap:14px;padding:14px;border-bottom:1px solid var(--line);background:var(--panel)}.image-panel>img{width:150px;height:120px;border-radius:10px;object-fit:cover}.image-panel label{display:grid;gap:5px;margin-bottom:9px;color:var(--text);font-size:.74rem;font-weight:800}.image-panel small{color:var(--muted);font-weight:500}.image-panel input{width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid var(--line);border-radius:8px;background:var(--input);color:var(--text)}.image-panel p{margin:5px 0;color:var(--orange);font-size:.75rem}.image-actions{display:flex;justify-content:flex-end;gap:8px}.image-actions button{padding:8px 12px;border:1px solid var(--line);border-radius:999px;background:var(--surface);color:var(--text)}.image-actions .insert{border-color:var(--orange);background:var(--orange);color:#fff}.image-help{margin:0;padding:9px 14px;border-top:1px solid var(--line);color:var(--muted);font-size:.7rem}@media(max-width:520px){.image-panel{grid-template-columns:1fr}.image-panel>img{width:100%;height:150px}}
</style>
