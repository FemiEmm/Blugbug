<template>
  <div class="article-content">
    <template v-for="(block, index) in blocks" :key="index">
      <div class="story-chunk" v-html="block.html"></div>
      <AdSlot v-if="adAfter.has(index)" placement="article" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AdSlot from './AdSlot.vue';

const props = defineProps<{ html: string }>();
const blocks = computed(() => {
  const body = new DOMParser().parseFromString(props.html, 'text/html').body;
  const nodes = [...body.children];
  return nodes.length ? nodes.map((node) => ({ html: node.outerHTML })) : [{ html: props.html }];
});
const adAfter = computed(() => {
  const positions = new Set<number>();
  let characters = 0;
  let blocksSinceAd = 0;
  blocks.value.forEach((block, index) => {
    const text = new DOMParser().parseFromString(block.html, 'text/html').body.textContent?.trim() || '';
    characters += text.length;
    blocksSinceAd += 1;
    if (characters >= 1100 && blocksSinceAd >= 6 && index < blocks.value.length - 4) {
      positions.add(index);
      characters = 0;
      blocksSinceAd = 0;
    }
  });
  return positions;
});
</script>

<style scoped>
.story-chunk :deep(figure){margin:30px 0}.story-chunk :deep(img){display:block;width:100%;max-height:680px;border-radius:16px;object-fit:contain;background:var(--surface)}.story-chunk :deep(figcaption){margin-top:9px;color:var(--muted);font:500 .8rem/1.5 Inter,sans-serif;text-align:center}
</style>
