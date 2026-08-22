<template>
  <div class="annotated-content">
    <template v-for="(block, index) in blocks" :key="index">
      <section class="paragraph-block" :class="{ active: selected === index, questioned: questionsFor(index).length }">
        <div class="story-chunk" v-html="block.html"></div>
        <button
          v-if="block.questionable"
          class="question-trigger"
          type="button"
          :aria-expanded="selected === index"
          :aria-controls="`paragraph-questions-${index}`"
          @click="toggle(index)"
        >
          <span class="question-mark" aria-hidden="true">?</span>
          <span>Question this paragraph</span>
          <b v-if="questionsFor(index).length">{{ questionsFor(index).length }}</b>
        </button>

        <div v-if="selected === index" :id="`paragraph-questions-${index}`" class="question-panel">
          <div class="panel-heading">
            <div><span class="eyebrow">Paragraph questions</span><h3>Ask about this exact point</h3></div>
            <button type="button" class="close" aria-label="Close paragraph questions" @click="selected = null">×</button>
          </div>

          <form v-if="authStore.isAuthenticated.value" class="question-form" @submit.prevent="submit(index)">
            <label :for="`question-${index}`">Your question</label>
            <textarea :id="`question-${index}`" v-model="questionBody" maxlength="1000" rows="3" placeholder="What would you like the blugger to explain?" required></textarea>
            <div><small>{{ questionBody.length }}/1000</small><button type="submit" :disabled="saving || !questionBody.trim()">Ask question</button></div>
          </form>
          <p v-else class="sign-in-note"><router-link :to="`/login?redirect=${encodeURIComponent(route.fullPath)}`">Sign in</router-link> to question this paragraph.</p>

          <div v-if="questionsFor(index).length" class="question-list">
            <article v-for="question in questionsFor(index)" :key="question.id" class="question-item">
              <button class="question-meta" type="button" @click="router.push(`/user/${question.user_id}`)"><span class="mini-avatar">{{ initials(question.full_name || question.chatter_name) }}</span><span><b>{{ question.full_name || question.chatter_name }}</b><small>@{{ question.chatter_name }}</small></span></button>
              <p class="question-text">{{ question.body }}</p>
              <div v-if="question.author_response" class="author-answer"><span>Blugger’s answer</span><p>{{ question.author_response }}</p></div>
              <form v-else-if="isAuthor" class="answer-form" @submit.prevent="answer(question)">
                <label :for="`answer-${question.id}`">Answer as the blugger</label>
                <textarea :id="`answer-${question.id}`" v-model="answerDrafts[question.id]" maxlength="2000" rows="2" required></textarea>
                <button type="submit" :disabled="saving || !answerDrafts[question.id]?.trim()">Post answer</button>
              </form>
            </article>
          </div>
          <p v-else class="empty">No questions yet. Be the first to ask about this paragraph.</p>
        </div>
      </section>
      <AdSlot v-if="(index + 1) % 4 === 0 && index < blocks.length - 1" placement="article" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AdSlot from './AdSlot.vue';
import { addParagraphQuestion, answerParagraphQuestion, listParagraphQuestions, type ParagraphQuestion } from '../api/social';
import { authStore } from '../stores/auth';

const props = defineProps<{ html: string; postId: string; postOwnerId: string }>();
const route = useRoute();
const router = useRouter();
const questions = ref<ParagraphQuestion[]>([]);
const selected = ref<number | null>(null);
const questionBody = ref('');
const saving = ref(false);
const answerDrafts = reactive<Record<string, string>>({});
const blocks = computed(() => {
  const body = new DOMParser().parseFromString(props.html, 'text/html').body;
  const nodes = [...body.children];
  if (!nodes.length) return [{ html: props.html, questionable: /<p\b/i.test(props.html) }];
  return nodes.map((node) => ({ html: node.outerHTML, questionable: node.tagName.toLowerCase() === 'p' }));
});
const isAuthor = computed(() => authStore.user.value?.id === props.postOwnerId || authStore.user.value?.role === 'admin');
const questionsFor = (index: number) => questions.value.filter((question) => question.paragraph_index === index);
const initials = (name = 'BB') => name.split(/[ ._-]+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
const load = async () => { questions.value = (await listParagraphQuestions(props.postId)).questions; };
const toggle = (index: number) => { selected.value = selected.value === index ? null : index; questionBody.value = ''; };
const submit = async (index: number) => {
  if (!questionBody.value.trim()) return;
  saving.value = true;
  try {
    const { question } = await addParagraphQuestion(props.postId, index, questionBody.value.trim());
    questions.value.push(question);
    questionBody.value = '';
  } finally { saving.value = false; }
};
const answer = async (question: ParagraphQuestion) => {
  const body = answerDrafts[question.id]?.trim();
  if (!body) return;
  saving.value = true;
  try {
    const result = await answerParagraphQuestion(question.id, body);
    const index = questions.value.findIndex((item) => item.id === question.id);
    if (index >= 0) questions.value[index] = result.question;
    answerDrafts[question.id] = '';
  } finally { saving.value = false; }
};
onMounted(load);
watch(() => props.postId, load);
</script>

<style scoped>
.paragraph-block{position:relative;margin-bottom:1.5em}.paragraph-block.questioned{border-left:2px solid color-mix(in srgb,var(--orange) 55%,transparent);padding-left:16px}.story-chunk :deep(p){margin:0}.question-trigger{position:absolute;right:-54px;top:2px;display:flex;align-items:center;gap:7px;min-height:32px;max-width:32px;padding:0;border:1px solid color-mix(in srgb,var(--orange) 45%,var(--line));border-radius:999px;background:var(--panel);color:var(--orange);cursor:pointer;overflow:hidden;white-space:nowrap;transition:max-width .2s,padding .2s,background .2s}.question-trigger:hover,.question-trigger:focus-visible,.paragraph-block.active .question-trigger{max-width:220px;padding:0 11px;background:var(--orange);color:white;z-index:2}.question-mark{display:grid;place-items:center;flex:0 0 30px;font:900 1rem/1 Inter,sans-serif}.question-trigger:hover .question-mark,.question-trigger:focus-visible .question-mark,.paragraph-block.active .question-mark{flex-basis:18px}.question-trigger span:nth-child(2){font:700 .72rem/1 Inter,sans-serif}.question-trigger b{font:800 .68rem/1 Inter,sans-serif}.question-panel{margin:18px 0 8px;padding:20px;border:1px solid color-mix(in srgb,var(--orange) 38%,var(--line));border-radius:16px;background:var(--panel);font-family:Inter,ui-sans-serif,system-ui;color:var(--text)}.panel-heading{display:flex;justify-content:space-between;gap:16px;align-items:start}.panel-heading h3{margin:5px 0 16px;font:700 1.25rem/1.2 Georgia,serif}.close{border:0;background:none;color:var(--muted);font-size:1.5rem;cursor:pointer}.question-form label,.answer-form label{display:block;margin-bottom:7px;font-size:.76rem;font-weight:800}.question-form textarea,.answer-form textarea{width:100%;box-sizing:border-box;padding:12px;border:1px solid var(--line);border-radius:11px;background:var(--input);color:var(--text);font:inherit;resize:vertical}.question-form>div{display:flex;justify-content:space-between;align-items:center;margin-top:9px}.question-form small{color:var(--muted)}.question-form button,.answer-form button{padding:9px 13px;border:0;border-radius:999px;background:var(--orange);color:white;font-weight:800;cursor:pointer}.question-form button:disabled,.answer-form button:disabled{opacity:.55}.question-list{display:grid;gap:12px;margin-top:18px}.question-item{padding:14px;border:1px solid var(--line);border-radius:13px;background:var(--surface)}.question-meta{display:flex;align-items:center;gap:9px}.mini-avatar{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:var(--orange);color:white;font-size:.66rem;font-weight:900}.question-meta p{display:grid;margin:0!important;line-height:1.2}.question-meta small{color:var(--muted)}.question-text{margin:12px 0!important;line-height:1.55}.author-answer{padding:12px;border-left:3px solid var(--orange);border-radius:0 10px 10px 0;background:color-mix(in srgb,var(--orange) 8%,var(--panel))}.author-answer span{color:var(--orange);font-size:.68rem;font-weight:900;text-transform:uppercase;letter-spacing:.1em}.author-answer p{margin:5px 0 0!important;line-height:1.5}.answer-form{margin-top:12px}.answer-form button{margin-top:8px}.empty,.sign-in-note{margin:12px 0 0!important;color:var(--muted);font-size:.82rem;line-height:1.5}.sign-in-note a{color:var(--orange);font-weight:800}
.story-chunk :deep(figure){margin:30px 0}.story-chunk :deep(img){display:block;width:100%;max-height:680px;border-radius:16px;object-fit:contain;background:var(--surface)}.story-chunk :deep(figcaption){margin-top:9px;color:var(--muted);font:500 .8rem/1.5 Inter,sans-serif;text-align:center}
.question-meta{padding:0;border:0;background:none;color:inherit;text-align:left;cursor:pointer}.question-meta>span:last-child{display:grid;line-height:1.2}.question-meta:hover b{text-decoration:underline;text-underline-offset:3px}
@media(max-width:600px){.paragraph-block{padding-bottom:40px}.question-trigger{right:auto;left:0;top:auto;bottom:0;max-width:none;width:auto;padding:0 11px;background:var(--panel)}.question-trigger .question-mark{flex-basis:18px}.question-panel{margin-top:12px;padding:15px}.paragraph-block.active{padding-bottom:40px}}
</style>
