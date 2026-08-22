<template>
  <div class="page-shell">
    <NavBar v-if="authStore.isAuthenticated.value" />
    <header v-else class="public-top"><img src="/brand_logo.svg" alt="Blugbug" /><router-link to="/login">Sign in</router-link></header>
    <AdSlot class="page-banner" placement="banner" />
    <main v-if="post" class="reader">
      <button class="back" @click="router.back()">← Back</button>
      <div class="reader-layout"><aside class="page-ad-rail"><AdSlot placement="sidebar"/><AdSlot placement="sidebar"/><AdSlot placement="sidebar"/></aside><section class="reader-main"><article class="story surface">
          <div v-if="post.header_image_url" class="story-image" :style="{ backgroundImage: `url(${post.header_image_url})` }"></div>
          <header><span class="eyebrow">{{ post.categories || 'Blugs' }}</span><h1>{{ post.title }}</h1><button class="byline" type="button" @click="router.push(`/user/${post.user_id}`)"><span class="avatar">{{ initials }}</span><span><b>{{ post.full_name }}</b><small>@{{ post.chatter_name }} · {{ new Date(post.created_at).toLocaleDateString('en', { month: 'long', day: 'numeric', year: 'numeric' }) }}</small></span></button></header>
          <div class="story-body"><ParagraphQuestions :html="post.content" :post-id="post.id" :post-owner-id="post.user_id" /></div>
          <footer><span>Published on Blugbug</span><button class="ghost-button" @click="router.push(`/user/${post.user_id}`)">More from this writer</button></footer>
        </article>
        <LocalInteractions v-if="authStore.isAuthenticated.value" :postId="post.id" />
        <section v-else class="join-card"><h2>Join the conversation</h2><p>Sign in to like, save, and reply to this blug.</p><router-link to="/login">Sign in to Blugbug</router-link></section></section>
        <aside class="reader-rail"><AdSlot placement="sidebar"/><section class="writer-card"><span class="eyebrow">The blugger</span><div><span class="avatar">{{ initials }}</span><p><b>{{post.full_name}}</b><small>@{{post.chatter_name}}</small></p></div><button @click="router.push(`/user/${post.user_id}`)">View profile</button></section><section class="topic-card"><span class="eyebrow">Keep exploring</span><h2>{{post.categories||'Blugs'}}</h2><p>Find more blugs and conversations across Blugbug.</p><button @click="router.push('/blugbugs')">Explore Blugbugs →</button></section><AdSlot placement="sidebar"/></aside>
      </div>
    </main>
    <div v-else class="loading">Opening blug…</div>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from './NavBar.vue';
import LocalInteractions from './LocalInteractions.vue';
import ParagraphQuestions from './ParagraphQuestions.vue';
import AdSlot from './AdSlot.vue';
import { getPost, getPublicPost } from '../api/posts';
import { authStore } from '../stores/auth';
import type { LocalPost } from '../api/types';
const route=useRoute(),router=useRouter(),post=ref<LocalPost|null>(null);
const initials=computed(()=>(post.value?.full_name||'BB').split(' ').map(x=>x[0]).slice(0,2).join(''));
const postId=computed(()=>String(route.params.blogId||route.query.blogId||''));
const load=async()=>{const request=route.params.blogId?getPublicPost:getPost;post.value=(await request(postId.value)).post;document.title=`${post.value.title} — Blugbug`};
onMounted(load);watch(postId,load);
</script>
<style scoped>
.public-top{height:68px;padding:0 max(18px,calc((100vw - 1180px)/2));display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);background:var(--panel)}.public-top img{width:130px}.public-top a,.join-card a{padding:10px 16px;border-radius:10px;background:var(--orange);color:white;font-weight:900;text-decoration:none}.reader{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:30px 0 100px}.reader-layout{display:grid;grid-template-columns:minmax(0,830px) 300px;gap:24px}.reader-main{min-width:0}.back{margin:0 0 18px;border:0;background:none;color:var(--muted);cursor:pointer}.back:hover{color:var(--orange)}.story{overflow:hidden}.story-image{height:380px;background-size:cover;background-position:center}.story header{padding:clamp(28px,6vw,64px) clamp(24px,7vw,72px) 24px}.story h1{font:700 clamp(2.5rem,5vw,4.4rem)/1.02 Georgia,serif;letter-spacing:-.035em;color:var(--text);margin:15px 0 28px}.byline{display:flex;align-items:center;gap:12px}.byline .avatar{width:46px;height:46px;font-size:.75rem}.byline p{margin:4px 0 0;color:var(--muted);font-size:.8rem}.story-body{padding:15px clamp(24px,7vw,72px) 38px;color:var(--text);font:1.1rem/1.9 Georgia,serif}.story-body :deep(p){margin:0 0 1.5em}.story-body :deep(h2),.story-body :deep(h3),.story-body :deep(h4){color:var(--text);font-size:1.8rem;margin-top:1.7em}.story-body :deep(.ad-slot){font-family:Inter,ui-sans-serif,system-ui;font-size:initial}.story footer{display:flex;justify-content:space-between;align-items:center;margin:0 clamp(24px,7vw,72px);padding:24px 0;border-top:1px solid var(--line);color:var(--muted);font-size:.8rem}.reader-rail{position:sticky;top:100px;align-self:start;display:grid;gap:18px}.writer-card,.topic-card{padding:20px;border:1px solid var(--line);border-radius:18px;background:var(--panel)}.writer-card>div{display:flex;align-items:center;gap:11px;margin:16px 0}.writer-card .avatar{width:42px;height:42px}.writer-card p{display:grid;margin:0}.writer-card small{color:var(--muted)}.writer-card button,.topic-card button{padding:8px 11px;border:1px solid var(--line);border-radius:9px;background:var(--soft);color:var(--text);font-weight:800;cursor:pointer}.writer-card button:hover,.topic-card button:hover{border-color:var(--orange);color:var(--orange)}.topic-card h2{margin:10px 0 5px;font:700 1.35rem Georgia;color:var(--text)}.topic-card p{color:var(--muted);font-size:.76rem;line-height:1.5}.topic-card button{padding-left:0;border:0;background:none;color:var(--orange)}.join-card{margin-top:24px;padding:24px;border:1px solid var(--line);border-radius:18px;background:var(--panel)}.join-card h2{margin:0;font:700 1.45rem Georgia}.join-card p{margin:8px 0 20px;color:var(--muted)}.loading{padding:150px;text-align:center;color:var(--muted)}@media(max-width:920px){.reader-layout{display:block}.reader-rail{display:none}.reader{width:min(830px,calc(100% - 28px))}}@media(max-width:600px){.reader{width:100%}.story{border-left:0;border-right:0;border-radius:0!important}.story-image{height:220px}.story h1{font-size:2.3rem}.story footer{display:block}.story footer button{margin-top:14px}.story-body{padding-left:20px;padding-right:20px}}
.byline{padding:0;border:0;background:none;color:inherit;text-align:left;cursor:pointer}.byline>span:last-child{display:grid}.byline small{margin-top:4px;color:var(--muted);font-size:.8rem}.byline:hover b{text-decoration:underline;text-underline-offset:3px}
</style>
