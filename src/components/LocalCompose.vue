<template>
  <div class="page-shell"><NavBar />
    <PageColumns><main class="compose-page">
      <header><button aria-label="Go back" @click="router.back()">←</button><div><h1>Create a blug</h1><p>Publish to Explore</p></div><button class="draft" @click="router.push('/explore')">Cancel</button></header>
      <section class="compose-card">
        <div class="author"><img :src="profileImage" alt="Your profile picture" /><div><b>{{ authStore.user.value?.full_name }}</b><span>@{{ authStore.user.value?.chatter_name }}</span></div><select v-model="category" aria-label="Choose a topic"><option value="" disabled>Choose topic</option><option v-for="item in categories" :key="item">{{ item }}</option></select></div>
        <textarea v-model="title" class="title" maxlength="120" rows="3" aria-label="Blug title" placeholder="Give your blug a title"></textarea>
        <LocalEditor :initialContent="content" @updateContent="content=$event" @mediaAdded="pendingMedia.push($event)" />
        <img v-if="preview" class="preview" :src="preview" alt="Cover preview" />
        <div class="tools"><label>▧ <span>Add cover</span><input type="file" hidden accept="image/*" @change="selectImage" /></label><span>{{ plainLength }} characters</span></div>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <footer><p>Everyone on Blugbug can read and reply</p><button class="primary-button" :disabled="publishing" @click="publish">{{ publishing ? 'Publishing…' : 'Publish blug' }}</button></footer>
      </section>
    </main></PageColumns>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from './NavBar.vue';
import PageColumns from './PageColumns.vue';
import LocalEditor from './LocalEditor.vue';
import { createPost, updatePost } from '../api/posts';
import { contentWithoutPendingMedia, pendingTokensInHtml, resolvePendingMedia, uploadImage, uploadPostMedia, type PendingInlineMedia } from '../api/uploads';
import { authStore } from '../stores/auth';
const router=useRouter(),title=ref(''),content=ref(''),category=ref(''),image=ref<File|null>(null),preview=ref(''),error=ref(''),publishing=ref(false),pendingMedia=ref<PendingInlineMedia[]>([]),categories=['Life','Culture','Tech','Travel','Food','Creativity','Finance','Wellness','Books','Community','Sports','Film'];
const plainLength=computed(()=>content.value.replace(/<[^>]*>/g,'').length);
const profileImage=computed(()=>authStore.user.value?.profile_image_url||'/Default_pfp.svg');
const selectImage=(e:Event)=>{const file=(e.target as HTMLInputElement).files?.[0];if(file){image.value=file;preview.value=URL.createObjectURL(file)}};
const publish=async()=>{if(!title.value.trim()||!content.value.trim()||!category.value){error.value='Add a title, topic, and blug text before publishing.';return}publishing.value=true;try{const tokens=pendingTokensInHtml(content.value);const active=pendingMedia.value.filter((item)=>tokens.has(item.token));const{post}=await createPost({title:title.value,content:contentWithoutPendingMedia(content.value),categories:category.value,status:'draft'});const uploaded=new Map();for(const item of active){const result=await uploadPostMedia(post.id,item);uploaded.set(item.token,result.media)}const finalContent=resolvePendingMedia(content.value,uploaded);await updatePost(post.id,{content:finalContent,status:'published'});if(image.value)await uploadImage(image.value,'header',post.id);active.forEach((item)=>URL.revokeObjectURL(item.previewUrl));await router.push({name:'BlugReader',query:{blogId:post.id}})}catch(e){error.value=e instanceof Error?e.message:'Could not publish this blug.'}finally{publishing.value=false}};
</script>

<style scoped>
.compose-page{width:min(720px,calc(100% - 28px));margin:auto;padding:26px 0 90px}.compose-page>header{display:flex;align-items:center;gap:13px;padding:0 4px 18px}.compose-page>header>button{border:0;background:none;color:var(--text);cursor:pointer}.compose-page>header>button:first-child{width:38px;height:38px;border:1px solid var(--line);border-radius:50%}.compose-page>header div{flex:1}.compose-page>header h1{margin:0;font-size:1.15rem}.compose-page>header p{margin:3px 0 0;color:var(--muted);font-size:.76rem}.compose-page>header .draft{color:var(--muted)}.compose-card{padding:20px;border:1px solid var(--line);border-radius:18px;background:var(--panel)}.author{display:flex;align-items:center;gap:10px;margin-bottom:18px}.author img{width:46px;height:46px;border-radius:50%;object-fit:cover}.author div{display:grid}.author span{color:var(--muted);font-size:.76rem}.author select{margin-left:auto;padding:8px 11px;border:1px solid var(--line);border-radius:999px;background:var(--input);color:var(--text);font-size:.76rem}.title{width:100%;padding:5px 0 14px;margin-bottom:14px;border:0;border-bottom:1px solid var(--line);background:none;color:var(--text);font:700 clamp(1.5rem,4vw,2.15rem)/1.2 Georgia,serif;outline:none}.title::placeholder{color:var(--muted)}.preview{display:block;width:100%;max-height:340px;margin-top:14px;border:1px solid var(--line);border-radius:14px;object-fit:cover}.tools{display:flex;align-items:center;padding:13px 2px;border-bottom:1px solid var(--line);color:var(--muted);font-size:.78rem}.tools label{color:var(--orange);font-weight:800;cursor:pointer}.tools>span{margin-left:auto}.error{color:var(--orange);font-size:.82rem}.compose-card footer{display:flex;align-items:center;gap:20px;padding-top:14px}.compose-card footer p{flex:1;margin:0;color:var(--muted);font-size:.78rem}@media(max-width:540px){.compose-page{width:100%;padding-top:10px}.compose-page>header{padding:8px 12px 14px}.compose-card{border-left:0;border-right:0;border-radius:0;padding:16px}.author select{max-width:125px}.compose-card footer p{display:none}.compose-card footer button{width:100%}}
.title{display:block;min-height:110px;resize:none;overflow-wrap:anywhere;white-space:pre-wrap;field-sizing:content}
.compose-page{width:100%;padding-top:0}
</style>
