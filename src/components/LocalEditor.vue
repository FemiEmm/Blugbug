<template>
  <div class="editor">
    <div class="toolbar" role="toolbar" aria-label="Blug formatting">
      <button type="button" aria-label="Bold" @mousedown.prevent="rememberSelection" @click="format('bold')"><b aria-hidden="true">B</b></button>
      <button type="button" aria-label="Italic" @mousedown.prevent="rememberSelection" @click="format('italic')"><i aria-hidden="true">I</i></button>
      <button type="button" aria-label="Bulleted list" @mousedown.prevent="rememberSelection" @click="format('insertUnorderedList')">List</button>
      <label class="image-button" @mousedown="rememberSelection"><span aria-hidden="true">▧</span> Image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="chooseImage" /></label>
    </div>
    <p v-if="imageError" class="image-error" role="alert">{{ imageError }}</p>
    <div ref="surface" class="surface" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Blug content" tabindex="0" @input="emitContent" @keyup="rememberSelection" @mouseup="rememberSelection"></div>
    <p class="image-help">Images appear where your cursor is. Keep writing underneath.</p>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import type { PendingInlineMedia } from '../api/uploads';
const props = defineProps<{ initialContent?: string }>();
const emit = defineEmits<{ updateContent: [content: string]; mediaAdded: [media: PendingInlineMedia] }>();
const surface = ref<HTMLElement | null>(null);
const imageError = ref('');
let savedRange: Range | null = null;
const sync = () => nextTick(() => { if (surface.value && surface.value.innerHTML !== props.initialContent) surface.value.innerHTML = props.initialContent || ''; });
onMounted(sync); watch(() => props.initialContent, sync);
const emitContent = () => emit('updateContent', surface.value?.innerHTML || '');
const rememberSelection = () => { const selection = window.getSelection(); if (!selection?.rangeCount || !surface.value) return; const range = selection.getRangeAt(0); if (surface.value.contains(range.commonAncestorContainer)) savedRange = range.cloneRange(); };
const restoreSelection = () => { if (!surface.value) return; surface.value.focus(); const selection = window.getSelection(); selection?.removeAllRanges(); if (savedRange) selection?.addRange(savedRange); else { const range = document.createRange(); range.selectNodeContents(surface.value); range.collapse(false); selection?.addRange(range); } };
const format = (command: string) => { restoreSelection(); document.execCommand(command); rememberSelection(); emitContent(); };
const chooseImage = (event: Event) => {
  const input = event.target as HTMLInputElement; const file = input.files?.[0]; input.value = ''; if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) { imageError.value = 'Choose a JPG, PNG, WebP, or GIF image.'; return; }
  if (file.size > 5 * 1024 * 1024) { imageError.value = 'Inline images must be 5 MB or smaller.'; return; }
  const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  const pending: PendingInlineMedia = { token: crypto.randomUUID(), file, previewUrl: URL.createObjectURL(file), altText: name || 'Image added to blug', caption: '' };
  imageError.value = '';
  restoreSelection(); const figure = document.createElement('figure'); figure.dataset.uploadToken = pending.token; figure.contentEditable = 'false';
  const image = document.createElement('img'); image.src = pending.previewUrl; image.alt = pending.altText; figure.appendChild(image);
  const paragraph = document.createElement('p'); paragraph.appendChild(document.createElement('br'));
  const selection = window.getSelection(); const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
  const start = range?.startContainer; const element = start instanceof Element ? start : start?.parentElement;
  const block = element?.closest('p,div,ul,ol');
  if (block && block !== surface.value && surface.value?.contains(block)) block.after(figure, paragraph);
  else surface.value?.append(figure, paragraph);
  const nextRange = document.createRange(); nextRange.selectNodeContents(paragraph); nextRange.collapse(true); selection?.removeAllRanges(); selection?.addRange(nextRange);
  emit('mediaAdded', pending); savedRange = nextRange.cloneRange(); emitContent();
};
</script>

<style scoped>
.editor{overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--input);color:var(--text)}.toolbar{display:flex;flex-wrap:wrap;gap:6px;padding:9px 11px;border-bottom:1px solid var(--line);background:var(--surface)}.toolbar button,.image-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:7px 11px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);font:700 .78rem/1 Inter,sans-serif;cursor:pointer}.toolbar button:hover,.toolbar button:focus-visible,.image-button:hover,.image-button:focus-within{border-color:var(--orange);color:var(--orange)}.surface{min-height:270px;padding:18px;outline:none;line-height:1.75}.surface:focus{box-shadow:inset 3px 0 var(--orange)}.surface :deep(figure){margin:24px 0;padding:0}.surface :deep(img){display:block;width:100%;max-height:520px;border-radius:12px;object-fit:contain;background:var(--surface)}.surface :deep(figcaption){padding:8px 4px 0;color:var(--muted);font-size:.8rem;text-align:center}.image-error{margin:0;padding:10px 14px;border-bottom:1px solid var(--line);color:var(--orange);font-size:.76rem;font-weight:700}.image-help{margin:0;padding:9px 14px;border-top:1px solid var(--line);color:var(--muted);font-size:.7rem}
</style>
