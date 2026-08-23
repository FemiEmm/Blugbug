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
const serializedContent = () => { const copy = surface.value?.cloneNode(true) as HTMLElement | undefined; copy?.querySelectorAll('[data-editor-control]').forEach((node) => node.remove()); return copy?.innerHTML || ''; };
const addImageControls = () => {
  surface.value?.querySelectorAll<HTMLElement>('figure').forEach((figure) => {
    if (figure.querySelector('[data-editor-control]')) return;
    const remove = document.createElement('button'); remove.type = 'button'; remove.dataset.editorControl = 'remove-image'; remove.className = 'remove-image'; remove.setAttribute('aria-label', 'Remove image'); remove.textContent = '×';
    remove.addEventListener('click', () => { const src = figure.querySelector('img')?.src || ''; if (src.startsWith('blob:')) URL.revokeObjectURL(src); figure.remove(); emitContent(); surface.value?.focus(); });
    figure.appendChild(remove);
  });
};
const sync = () => nextTick(() => { if (surface.value && serializedContent() !== (props.initialContent || '')) surface.value.innerHTML = props.initialContent || ''; addImageControls(); });
onMounted(sync); watch(() => props.initialContent, sync);
const emitContent = () => emit('updateContent', serializedContent());
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
  addImageControls();
  const nextRange = document.createRange(); nextRange.selectNodeContents(paragraph); nextRange.collapse(true); selection?.removeAllRanges(); selection?.addRange(nextRange);
  emit('mediaAdded', pending); savedRange = nextRange.cloneRange(); emitContent();
};
</script>

<style scoped>
.editor{overflow:hidden;border:1px solid var(--line);border-radius:14px;background:var(--input);color:var(--text)}.toolbar{display:flex;flex-wrap:wrap;gap:6px;padding:9px 11px;border-bottom:1px solid var(--line);background:var(--surface)}.toolbar button,.image-button{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:36px;padding:7px 11px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--text);font:700 .78rem/1 Inter,sans-serif;cursor:pointer}.toolbar button:hover,.toolbar button:focus-visible,.image-button:hover,.image-button:focus-within{border-color:var(--orange);color:var(--orange)}.surface{min-height:270px;padding:18px;outline:none;line-height:1.75}.surface:focus{box-shadow:inset 3px 0 var(--orange)}.surface :deep(figure){position:relative;margin:24px 0;padding:0}.surface :deep(img){display:block;width:100%;max-height:520px;border-radius:12px;object-fit:contain;background:var(--surface)}.surface :deep(figcaption){padding:8px 4px 0;color:var(--muted);font-size:.8rem;text-align:center}.surface :deep(.remove-image){position:absolute;top:10px;right:10px;display:grid;place-items:center;width:38px;height:38px;padding:0;border:1px solid rgba(255,255,255,.76);border-radius:50%;background:rgba(20,18,17,.88);color:#fff;font:700 1.45rem/1 Arial,sans-serif;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.28)}.surface :deep(.remove-image:hover),.surface :deep(.remove-image:focus-visible){background:var(--orange);outline:3px solid rgba(255,255,255,.9);outline-offset:2px}.image-error{margin:0;padding:10px 14px;border-bottom:1px solid var(--line);color:var(--orange);font-size:.76rem;font-weight:700}.image-help{margin:0;padding:9px 14px;border-top:1px solid var(--line);color:var(--muted);font-size:.7rem}
</style>
