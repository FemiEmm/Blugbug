<template>
  <main class="connections-page">
    <NavBar />
    <AdSlot class="page-banner" placement="banner" />
    <div class="connections-workspace">
      <aside class="page-ad-rail"><AdSlot placement="sidebar"/><AdSlot placement="sidebar"/><AdSlot placement="sidebar"/></aside>
      <section class="connections-main">
        <header class="page-head"><div><span class="eyebrow">Your community</span><h1>Connections</h1></div><label class="people-search"><span>⌕</span><input v-model="search" placeholder="Search people" aria-label="Search connections" /></label></header>
        <nav class="connection-tabs" aria-label="Connection lists"><button :class="{ active: mode === 'followers' }" @click="load('followers')">Followers <b>{{ followerCount }}</b></button><button :class="{ active: mode === 'following' }" @click="load('following')">Following <b>{{ followingCount }}</b></button></nav>
        <div class="people-list">
          <article v-for="person in filteredUsers" :key="person.id"><button class="person-profile" @click="router.push(`/user/${person.id}`)"><img :src="person.profile_image_url || '/Default_pfp.svg'" :alt="person.full_name" /><span><b>{{ person.full_name }}</b><small>@{{ person.chatter_name }}</small><p>{{ person.about_me || 'Sharing blugs and joining conversations on Blugbug.' }}</p></span></button><button class="relationship" :class="{ connected: followingIds.has(person.id) }" @click="toggle(person.id)">{{ followingIds.has(person.id) ? 'Following' : 'Follow' }}</button></article>
          <p v-if="!filteredUsers.length" class="empty">No {{ mode }} match your search.</p>
        </div>
      </section>
      <aside class="connections-rail">
        <section class="rail-card"><header><b>Suggested for you</b><button @click="router.push('/blugbugs')">View all</button></header><article v-for="person in suggestions" :key="person.id"><img :src="person.profile_image_url || '/Default_pfp.svg'" :alt="person.full_name" /><button class="rail-name" @click="router.push(`/user/${person.id}`)"><b>{{ person.full_name }}</b><small>@{{ person.chatter_name }}</small></button><button class="rail-follow" @click="toggle(person.id)">{{ followingIds.has(person.id) ? '✓' : '+' }}</button></article></section>
        <section class="rail-note"><span class="eyebrow">Build your feed</span><h2>Follow voices you enjoy.</h2><p>The people and channels you follow shape what appears on Home.</p><button @click="router.push('/blugbugs')">Explore Blugbugs</button></section>
      </aside>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from './NavBar.vue';
import AdSlot from './AdSlot.vue';
import { authStore } from '../stores/auth';
import { getFollowStatus, listConnections, setFollowing } from '../api/social';
import { listUsers } from '../api/users';
import type { LocalUser } from '../api/types';
const route=useRoute(),router=useRouter(),users=ref<LocalUser[]>([]),allUsers=ref<LocalUser[]>([]),search=ref(''),mode=ref<'followers'|'following'>('followers'),followingIds=ref(new Set<string>()),followerCount=ref(0),followingCount=ref(0);
const me=computed(()=>authStore.user.value?.id);
const filteredUsers=computed(()=>{const term=search.value.trim().toLowerCase();return users.value.filter(person=>!term||`${person.full_name} ${person.chatter_name} ${person.about_me}`.toLowerCase().includes(term));});
const suggestions=computed(()=>allUsers.value.filter(person=>person.id!==me.value&&!users.value.some(item=>item.id===person.id)).slice(0,5));
const refreshCounts=async()=>{if(!me.value)return;const status=await getFollowStatus(me.value);followerCount.value=status.followers;followingCount.value=status.followingCount;};
const load=async(type:'followers'|'following')=>{if(!me.value)return;mode.value=type;const [connections,following]=await Promise.all([listConnections(me.value,type),listConnections(me.value,'following')]);users.value=connections.users;followingIds.value=new Set(following.users.map(person=>person.id));await refreshCounts();};
const toggle=async(id:string)=>{const enabled=!followingIds.value.has(id);await setFollowing(id,enabled);enabled?followingIds.value.add(id):followingIds.value.delete(id);followingIds.value=new Set(followingIds.value);await load(mode.value);};
onMounted(async()=>{allUsers.value=(await listUsers()).users;await load(route.query.tab==='following'?'following':'followers');});
</script>

<style scoped>
.connections-page{min-height:100vh;padding:112px 22px 90px}.connections-workspace{display:grid;grid-template-columns:minmax(0,1fr) 310px;width:min(1120px,100%);margin:auto;border:1px solid rgba(255,255,255,.16);border-radius:28px;background:rgba(79,71,74,.62);box-shadow:0 28px 80px rgba(10,9,11,.28);backdrop-filter:blur(24px);overflow:hidden}.connections-main{padding:28px 30px 36px;border-right:1px solid rgba(255,255,255,.14)}.page-head{display:flex;align-items:end;justify-content:space-between;gap:24px}.page-head h1{margin:5px 0 0;font:700 clamp(2rem,4vw,3.15rem)/1 Georgia,serif}.people-search{display:flex;align-items:center;gap:8px;width:min(280px,45%);padding:10px 12px;border-radius:10px;background:rgba(32,28,31,.48)}.people-search input{width:100%;border:0;outline:0;background:none;color:var(--cream)}.connection-tabs{display:flex;gap:24px;margin-top:28px;border-bottom:1px solid rgba(255,255,255,.14)}.connection-tabs button{position:relative;padding:0 1px 12px;border:0;background:none;color:var(--muted);cursor:pointer}.connection-tabs button b{margin-left:5px;color:inherit}.connection-tabs button.active{color:#fff}.connection-tabs button.active:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--orange)}.people-list article{display:flex;align-items:center;gap:18px;padding:18px 4px;border-bottom:1px solid rgba(255,255,255,.12)}.person-profile{display:flex;align-items:center;gap:14px;min-width:0;flex:1;padding:0;border:0;background:none;color:#fff;text-align:left;cursor:pointer}.person-profile img{flex:0 0 54px;width:54px;height:54px;border-radius:50%;object-fit:cover}.person-profile>span{display:block;min-width:0}.person-profile b,.person-profile small{display:block}.person-profile small{margin-top:2px;color:var(--muted);font-size:.72rem}.person-profile p{overflow:hidden;margin:7px 0 0;color:#cbc2bf;font-size:.78rem;white-space:nowrap;text-overflow:ellipsis}.relationship{min-width:90px;padding:9px 14px;border:0;border-radius:10px;background:var(--orange);color:#fff;font-size:.72rem;font-weight:800;cursor:pointer}.relationship.connected{background:rgba(239,225,216,.16)}.empty{padding:60px 10px;color:var(--muted);text-align:center}.connections-rail{padding:28px 22px}.rail-card>header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.rail-card>header b{font-size:.8rem}.rail-card>header button,.rail-note button{padding:7px 10px;border:0;border-radius:9px;background:rgba(239,225,216,.15);color:#fff;font-size:.66rem;cursor:pointer}.rail-card article{display:flex;align-items:center;gap:9px;padding:9px 0}.rail-card article>img{width:36px;height:36px;border-radius:50%;object-fit:cover}.rail-name{display:grid;min-width:0;flex:1;padding:0;border:0;background:none;color:#fff;text-align:left;cursor:pointer}.rail-name b,.rail-name small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.rail-name b{font-size:.73rem}.rail-name small{color:var(--muted);font-size:.62rem}.rail-follow{display:grid;place-items:center;width:29px;height:29px;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:none;color:#fff;cursor:pointer}.rail-note{margin-top:28px;padding-top:24px;border-top:1px solid rgba(255,255,255,.14)}.rail-note h2{margin:8px 0;font:700 1.35rem/1.15 Georgia,serif}.rail-note p{color:var(--muted);font-size:.78rem;line-height:1.55}.rail-note button{margin-top:6px;background:var(--orange)}
@media(max-width:800px){.connections-page{padding:86px 0 82px}.connections-workspace{display:block;border-left:0;border-right:0;border-radius:0}.connections-main{padding:24px 16px;border-right:0}.connections-rail{display:none}.page-head{display:block}.people-search{width:100%;margin-top:18px}.person-profile p{max-width:50vw}.relationship{min-width:78px;padding:8px 10px}}
</style>
