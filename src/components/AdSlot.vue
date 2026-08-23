<template><aside v-if="showPlaceholder" class="ad-slot" :class="`ad-${placement}`" :aria-label="`Advertisement: ${placement}`"><span>Advertisement</span><div aria-hidden="true"><b>Ad space</b><small>{{ sizeLabel }}</small></div></aside></template>
<script setup lang="ts">
import { computed } from 'vue';
const props=withDefaults(defineProps<{placement?:'sidebar'|'feed'|'article'|'banner';preview?:boolean}>(),{placement:'sidebar',preview:true});
const showPlaceholder=computed(()=>props.preview||Boolean(import.meta.env.VITE_ADSENSE_CLIENT));
const sizeLabel=computed(()=>props.placement==='sidebar'?'Responsive sidebar':props.placement==='feed'?'Responsive in-feed':props.placement==='banner'?'Responsive banner':'Responsive article');
</script>
<style scoped>.ad-slot{position:relative;display:grid;place-items:center;min-height:190px;border:1px dashed var(--line);border-radius:16px;background:var(--panel-2);color:var(--muted);text-align:center}.ad-slot>span{position:absolute;top:10px;left:10px;font-size:.75rem;letter-spacing:.1em;text-transform:uppercase}.ad-slot div{display:grid;gap:4px}.ad-slot b{font-size:.78rem}.ad-slot small{font-size:.75rem}.ad-feed{min-height:110px;margin:14px 0}.ad-article{min-height:96px;margin:46px 0}.ad-banner{min-height:104px}@media(max-width:800px){.ad-sidebar{display:none}.ad-feed{min-height:90px}.ad-article{min-height:84px;margin:34px 0}.ad-banner{min-height:80px;border-radius:0}}</style>
