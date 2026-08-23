<template>
  <div class="page-shell"><NavBar /><AdSlot class="global-banner" placement="banner" />
    <main class="home-layout" :class="{ 'explore-mode': isExplore, 'home-revamp': !isExplore }">
      <aside v-if="!isExplore" class="left-ad-rail" aria-label="Sponsored content"><AdSlot placement="sidebar"/><AdSlot placement="sidebar"/><AdSlot placement="sidebar"/></aside>
      <section class="main-column">
        <section v-if="!isExplore" class="identity-card">
          <img class="header-photo" :src="headerImage" alt="Your profile header" />
          <label class="header-search"><span aria-hidden="true">⌕</span><input v-model="search" aria-label="Search your feed" placeholder="Search your feed" /></label>
          <div class="identity-row"><img class="profile-photo" :src="profileImage" alt="Your profile picture" /><div class="identity-copy"><h1>{{ user?.full_name }}</h1><p>@{{ user?.chatter_name }}</p></div><nav class="profile-metrics" aria-label="Your profile statistics"><button @click="router.push('/myblug')"><b>{{ profileStats.blugs }}</b><span>Blugs</span></button><i></i><button @click="openConnections('followers')"><b>{{ profileStats.followers }}</b><span>Followers</span></button><i></i><button @click="openConnections('following')"><b>{{ profileStats.following }}</b><span>Following</span></button></nav><div class="profile-actions"><button class="new-blug" @click="router.push('/create-blog')">+ New blug</button><button class="ghost-button" @click="router.push(`/user/${user?.id}`)">View profile</button></div></div>
        </section>

        <section v-if="isExplore" class="explore-hub">
          <section class="search-hero">
            <form class="hero-search" @submit.prevent>
              <label class="hero-input"><span aria-hidden="true">⌕</span><input v-model="search" aria-label="Search blugs or users" placeholder="Search blugs or users" /></label>
              <select v-model="topicFilter" aria-label="Filter by topic"><option value="">All topics</option><option v-for="topic in topics" :key="topic.name" :value="topic.name">{{ topic.name }}</option></select>
              <button class="search-button">Search</button>
            </form>
          </section>
          <div class="discovery-panels">
            <section class="voices-panel">
              <header><span class="eyebrow">{{ search.trim() ? 'People' : 'New voices' }}</span></header>
              <div class="people-gallery"><article v-for="person in filteredUsers" :key="person.id"><button class="person-copy" @click="router.push(`/user/${person.id}`)"><img :src="person.profile_image_url || '/Default_pfp.svg'" :alt="person.full_name" /><span><b>{{ person.full_name }}</b><small>@{{ person.chatter_name }}</small></span></button><button class="follow" :aria-label="`${followed.has(person.id) ? 'Unfollow' : 'Follow'} ${person.full_name}`" :title="followed.has(person.id) ? 'Following' : 'Follow'" @click="follow(person.id)">{{ followed.has(person.id) ? '✓' : '+' }}</button></article></div>
            </section>
          </div>
        </section>
        <div v-if="!isExplore" class="feed-heading"><div><span class="eyebrow">From people you follow</span><h2>Home</h2></div><div class="feed-filters"><button class="active">Top</button><button>New</button></div></div>
        <section class="feed"><template v-for="(post,index) in visiblePosts" :key="post.id"><LocalPostCard :post="post" :grid-mode="isExplore" /><AdSlot v-if="index > 0 && (index + 1) % 6 === 0" placement="feed" /></template><p v-if="!visiblePosts.length" class="empty-feed">{{ isExplore ? 'No blugbugs match those filters.' : 'Follow people in Blugbugs to fill your Home feed.' }}</p></section>
      </section>

      <aside v-if="!isExplore" class="discovery-column">
        <AdSlot placement="sidebar" />
        <section class="suggestions"><header><b>Follow suggestions</b><button @click="router.push('/blugbugs')">View all</button></header><article v-for="person in suggestedUsers" :key="person.id"><img :src="person.profile_image_url || '/Default_pfp.svg'" :alt="person.full_name" /><button class="suggestion-name" @click="router.push(`/user/${person.id}`)"><b>{{ person.full_name }}</b><small>@{{ person.chatter_name }}</small></button><button class="suggestion-follow" :aria-label="`${followed.has(person.id)?'Unfollow':'Follow'} ${person.full_name}`" @click="follow(person.id)">{{ followed.has(person.id) ? 'Following' : 'Follow' }}</button></article></section>
        <section class="topics surface"><header><span class="eyebrow">Discover</span><h3>Popular topics</h3></header><div class="topic-pills"><button v-for="(topic,index) in filteredTopics" :key="topic.name" @click="topicFilter=topic.name"><i aria-hidden="true">{{ ['●','◆','▲','■','✦','✿','◉'][index%7] }}</i><b>{{ topic.name }}</b></button></div></section>
        <AdSlot placement="sidebar" />
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NavBar from './NavBar.vue';
import LocalPostCard from './LocalPostCard.vue';
import AdSlot from './AdSlot.vue';
import { listPosts } from '../api/posts';
import { authStore } from '../stores/auth';
import { listUsers } from '../api/users';
import { getFollowStatus, listConnections, setFollowing } from '../api/social';
import type { LocalPost, LocalUser } from '../api/types';
const route = useRoute(), router = useRouter(), posts = ref<LocalPost[]>([]), users = ref<LocalUser[]>([]), search = ref(''), topicFilter = ref(''), sortMode = ref<'latest'|'title'>('latest'), user = authStore.user, followed = ref(new Set<string>());
const profileStats = ref({ blugs: 0, followers: 0, following: 0 });
const isExplore = computed(() => route.path === '/blugbugs');
const profileImage = computed(() => user.value?.profile_image_url || '/Default_pfp.svg');
const headerImage = computed(() => user.value?.header_image_url || '/Default_Header.svg');
const topics = computed(() => { const counts = new Map<string,number>(); posts.value.forEach(p => counts.set(p.categories || 'General',(counts.get(p.categories || 'General') || 0)+1)); return [...counts].sort((a,b)=>b[1]-a[1]).map(([name,count])=>({name,count})); });
const filteredTopics = computed(() => topics.value.filter(t => t.name.toLowerCase().includes(search.value.toLowerCase())).slice(0,7));
const filteredUsers = computed(() => users.value.filter(person => person.id !== user.value?.id && (`${person.full_name} ${person.chatter_name}`).toLowerCase().includes(search.value.toLowerCase())).slice(0,5));
const suggestedUsers = computed(() => users.value.filter(person => person.id !== user.value?.id).slice(0,5));
const visiblePosts = computed(() => { const term=search.value.trim().toLowerCase(); const filtered=posts.value.filter(post=>(!topicFilter.value||post.categories===topicFilter.value)&&(!term||`${post.title} ${post.categories} ${post.full_name} ${post.chatter_name} ${post.content.replace(/<[^>]*>/g,' ')}`.toLowerCase().includes(term))); return isExplore.value ? filtered : [...filtered].sort((a,b)=>sortMode.value==='title'?a.title.localeCompare(b.title):new Date(b.created_at).getTime()-new Date(a.created_at).getTime()); });
const clearFilters = () => { search.value=''; topicFilter.value=''; sortMode.value='latest'; };
const follow = async (id:string) => {if(!authStore.isAuthenticated.value){window.dispatchEvent(new CustomEvent('blugbug:auth-required'));return}const enabled=!followed.value.has(id); await setFollowing(id,enabled); enabled?followed.value.add(id):followed.value.delete(id); followed.value=new Set(followed.value); };
const openConnections = (tab:'followers'|'following') => router.push({ path:'/connections', query:{ tab } });
const load = async () => { const loaded=(await listPosts(undefined,isExplore.value?undefined:'following')).posts; posts.value=isExplore.value?[...loaded].sort(()=>Math.random()-.5):loaded; if(isExplore.value){users.value=(await listUsers()).users;}else if(user.value){const [own,status,people,following]=await Promise.all([listPosts(user.value.id),getFollowStatus(user.value.id),listUsers(),listConnections(user.value.id,'following')]);users.value=people.users;followed.value=new Set(following.users.map(person=>person.id));profileStats.value={blugs:own.posts.length,followers:status.followers,following:status.followingCount};} };
onMounted(load);
watch(() => route.path, load);
</script>

<style scoped>
.home-layout{width:min(1110px,calc(100% - 32px));margin:0 auto;display:grid;grid-template-columns:minmax(0,730px) 330px;gap:28px;padding:26px 0 80px}.main-column{min-width:0}.identity-card{overflow:hidden;border:1px solid var(--line);border-radius:18px;background:var(--panel)}.header-photo{display:block;width:100%;height:124px;object-fit:cover;background:#252a31}.identity-row{min-height:88px;display:flex;align-items:center;gap:14px;padding:12px 18px 14px}.profile-photo{width:78px;height:78px;margin-top:-44px;border:4px solid var(--panel);border-radius:50%;object-fit:cover;background:#252a31}.identity-row h1{margin:0;font-size:1.05rem}.identity-row p{margin:3px 0 0;color:var(--muted);font-size:.82rem}.identity-row button{margin-left:auto}.composer{display:flex;align-items:center;gap:12px;margin:14px 0;padding:14px 16px;border:1px solid var(--line);border-radius:18px;background:var(--panel)}.composer>img{width:44px;height:44px;border-radius:50%;object-fit:cover}.composer>button{display:flex;align-items:center;flex:1;padding:12px 14px;border:1px solid var(--line);border-radius:999px;background:#111318;color:var(--muted);text-align:left;cursor:pointer}.composer>button span{flex:1}.composer>button b{color:var(--orange)}.feed-heading{display:flex;justify-content:space-between;align-items:end;padding:16px 4px 12px}.feed-heading h2{margin:4px 0 0;font-size:1.25rem}.feed-filters{display:flex;padding:3px;border:1px solid var(--line);border-radius:999px}.feed-filters button{padding:6px 13px;border:0;border-radius:999px;background:none;color:var(--muted);font-size:.77rem;font-weight:800}.feed-filters .active{background:var(--orange);color:white}.feed{overflow:hidden;border:1px solid var(--line);border-radius:18px;background:var(--panel)}.discovery-column{position:sticky;top:98px;align-self:start;display:grid;gap:16px}.search-box{display:flex;align-items:center;gap:9px;padding:11px 14px;border:1px solid var(--line);border-radius:999px;background:var(--panel)}.search-box input{width:100%;border:0;outline:0;background:none;color:var(--cream)}.topics{overflow:hidden;border-radius:18px;box-shadow:none}.topics header{padding:20px 20px 13px}.topics h3{margin:5px 0 0;font-size:1.15rem}.topics button{display:flex;align-items:center;width:100%;padding:14px 20px;border:0;border-top:1px solid var(--line);background:none;color:var(--cream);text-align:left;cursor:pointer}.topics button:hover{background:#1d2128}.topics button div{flex:1}.topics small{display:block;margin-top:3px;color:var(--muted)}.topics button>span{color:var(--orange);font-size:1.3rem}.about-box{padding:20px;border:1px solid #56301f;border-radius:18px;background:#211914}.about-box p{color:#b7aaa0;line-height:1.55;font-size:.85rem}.about-box button{padding:0;border:0;background:none;color:var(--orange);font-weight:900;cursor:pointer}@media(max-width:900px){.home-layout{grid-template-columns:1fr}.discovery-column{position:static;grid-template-columns:1fr 1fr}.search-box{grid-column:1/-1}}@media(max-width:620px){.home-layout{width:100%;padding-top:0}.identity-card,.composer,.feed{border-left:0;border-right:0;border-radius:0}.discovery-column{display:none}.header-photo{height:105px}.identity-row{padding-left:14px;padding-right:14px}.profile-photo{width:68px;height:68px}.composer{margin-top:10px}.identity-row .ghost-button{font-size:.75rem;padding:8px 11px}}
.empty-feed{padding:50px 24px;color:var(--muted);text-align:center}.people{overflow:hidden;box-shadow:none}.people header{padding:19px 18px 12px}.people h3{margin:5px 0 0}.people article{display:flex;align-items:center;gap:9px;padding:11px 14px;border-top:1px solid var(--line)}.people article img{width:38px;height:38px;border-radius:50%;object-fit:cover}.person-copy{display:grid;flex:1;border:0;background:none;color:var(--cream);text-align:left;cursor:pointer}.person-copy small{color:var(--muted)}.follow{padding:6px 10px;border:1px solid var(--orange);border-radius:999px;background:none;color:var(--orange);font-size:.7rem;font-weight:900;cursor:pointer}
.explore-search{padding:28px;margin-bottom:8px;border:1px solid var(--line);border-radius:18px;background:var(--panel)}.explore-search h1{margin:7px 0 22px;font:700 2rem Georgia}.search-input{display:flex;align-items:center;gap:10px;padding:13px 15px;border:1px solid var(--line);border-radius:12px;background:#101217}.search-input input{width:100%;border:0;outline:0;background:none;color:var(--cream)}.filter-row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.filter-row select,.filter-row button{padding:8px 12px;border:1px solid var(--line);border-radius:999px;background:#111318;color:var(--muted);font-size:.76rem;font-weight:800}.filter-row button.active{border-color:var(--orange);background:var(--orange);color:white}
.explore-mode{width:min(1280px,calc(100% - 32px));display:flex;flex-direction:column;gap:18px}.explore-mode .main-column{display:contents}.explore-mode .explore-search{order:1;margin:0}.explore-mode .discovery-column{position:static;order:2;display:grid;grid-template-columns:1fr 1fr;gap:18px}.explore-mode .people{order:1}.explore-mode .topics{order:2}.explore-mode .feed-heading{order:3;padding:5px 4px 0}.explore-mode .feed{order:4;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:start;overflow:visible;border:0;background:transparent;gap:18px}.explore-mode .feed :deep(.post-card){height:100%;display:block;padding:18px;border:1px solid var(--line);border-radius:18px;background:var(--panel)}.explore-mode .feed :deep(.author-photo){float:left;margin:0 10px 8px 0}.explore-mode .feed :deep(.post-image){aspect-ratio:16/9;height:auto;object-fit:cover}.explore-mode .feed :deep(.post-content footer){flex-wrap:wrap;gap:2px}
.explore-mode .feed :deep(.ad-feed){grid-column:1/-1;width:100%;min-height:120px;margin:2px 0;border-radius:18px}
.explore-top{display:flex;align-items:end;gap:28px}.explore-title{flex:0 0 auto}.explore-title h1{margin-bottom:0;white-space:nowrap}.explore-controls{display:grid;grid-template-columns:minmax(260px,1fr) 140px auto;gap:10px;flex:1;margin:0}.explore-controls .search-input{min-width:0}.explore-controls select{padding:0 12px;border:1px solid var(--line);border-radius:12px;background:#101217;color:var(--cream)}.search-button{padding:0 20px;border:0;border-radius:12px;background:var(--orange);color:white;font-weight:900;cursor:pointer}.voice-strip,.topic-strip{display:flex;align-items:center;gap:10px;margin-top:18px;padding-top:16px;border-top:1px solid var(--line);overflow-x:auto;scrollbar-width:thin}.strip-heading{flex:0 0 140px;display:grid;gap:4px}.voice-strip article{flex:0 0 200px;display:grid;grid-template-columns:38px 1fr;align-items:center;gap:8px;padding:10px;border:1px solid var(--line);border-radius:12px;background:#111318}.voice-strip article>img{width:38px;height:38px;border-radius:50%;object-fit:cover}.voice-strip .person-copy{min-width:0}.voice-strip .person-copy b,.voice-strip .person-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.voice-strip .follow{grid-column:1/-1;width:100%}.topic-strip>button{flex:0 0 128px;display:grid;gap:3px;padding:12px;border:1px solid var(--line);border-radius:12px;background:#111318;color:var(--cream);text-align:left;cursor:pointer}.topic-strip>button:hover{border-color:var(--orange)}.topic-strip small{color:var(--muted)}
@media(max-width:980px){.explore-mode .feed{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:1100px){.explore-top{display:block}.explore-controls{margin-top:16px}}
@media(max-width:680px){.explore-mode{width:100%;gap:12px}.explore-mode .explore-search{border-left:0;border-right:0;border-radius:0}.explore-mode .discovery-column{display:block}.explore-mode .discovery-column>section{margin-bottom:12px;border-left:0;border-right:0;border-radius:0}.explore-mode .feed{grid-template-columns:1fr;padding:0 12px}.explore-mode .feed-heading{padding:6px 14px}.explore-mode .feed :deep(.post-card){border-radius:14px}}
@media(max-width:680px){.explore-controls{grid-template-columns:1fr 110px}.explore-controls .search-input{grid-column:1/-1}.search-button{min-height:42px}.explore-title h1{white-space:normal}.strip-heading{flex-basis:110px}}
.about-box{border-color:rgba(107,80,246,.35);background:#171526}
@media(max-width:680px){
  .explore-mode{padding-bottom:88px;background:#0f1115}
  .explore-mode .explore-search{padding:22px 16px 18px;background:#171a20}
  .explore-title h1{font-size:clamp(1.65rem,8vw,2.15rem);line-height:1.05;letter-spacing:-.025em}
  .explore-controls{grid-template-columns:minmax(0,1fr) 116px;gap:8px}
  .explore-controls .search-input{min-height:50px;border-radius:14px}
  .explore-controls select,.search-button{min-height:46px;border-radius:13px}
  .search-button{padding:0 14px}
  .voice-strip,.topic-strip{gap:9px;margin-left:-16px;margin-right:-16px;padding-left:16px;padding-right:16px;padding-bottom:8px;scroll-snap-type:x proximity;scrollbar-width:none}
  .voice-strip::-webkit-scrollbar,.topic-strip::-webkit-scrollbar{display:none}
  .strip-heading{flex-basis:118px;position:sticky;left:0;z-index:2;align-self:stretch;justify-content:center;padding-right:10px;background:#171a20}
  .voice-strip article{flex-basis:210px;scroll-snap-align:start;border-radius:16px}
  .topic-strip>button{flex-basis:138px;min-height:68px;scroll-snap-align:start;border-radius:16px}
  .explore-mode .feed{gap:14px}
  .explore-mode .feed :deep(.grid-card){padding:16px;border-radius:18px}
}

/* Explore — distinct discovery experience */
.explore-hub{display:grid;gap:18px}
.search-hero{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(320px,.72fr) minmax(480px,1.28fr);align-items:end;gap:40px;min-height:270px;padding:38px;border:1px solid var(--line);border-radius:28px;background:#171a20}
.search-hero::after{content:"";position:absolute;right:-54px;top:-72px;width:210px;height:210px;border:42px solid rgba(107,80,246,.13);border-radius:50%;pointer-events:none}
.hero-copy{position:relative;z-index:1}.hero-copy h1{margin:10px 0 12px;font:700 clamp(2.4rem,4vw,4.15rem)/.94 Georgia,serif;letter-spacing:-.045em}.hero-copy h1 em{color:var(--orange);font-weight:inherit}.hero-copy p{max-width:430px;margin:0;color:var(--muted);line-height:1.55}
.hero-search{position:relative;z-index:1;display:grid;grid-template-columns:minmax(0,1fr) 145px auto;gap:10px;padding:10px;border:1px solid #343945;border-radius:18px;background:#101217;box-shadow:0 18px 50px rgba(0,0,0,.24)}
.hero-input{display:flex;align-items:center;gap:10px;min-width:0;padding:0 12px}.hero-input span{color:var(--orange);font-size:1.25rem}.hero-input input{width:100%;min-width:0;border:0;outline:0;background:none;color:var(--cream);font:inherit}.hero-search select{min-height:50px;padding:0 12px;border:1px solid var(--line);border-radius:12px;background:#171a20;color:var(--cream)}.hero-search .search-button{min-height:50px;border-radius:12px}
.discovery-panels{display:grid;grid-template-columns:1.35fr .85fr;gap:18px}.voices-panel,.browse-panel{min-width:0;padding:24px;border:1px solid var(--line);border-radius:22px;background:var(--panel)}.voices-panel>header,.browse-panel>header{display:flex;align-items:end;justify-content:space-between;gap:15px;margin-bottom:18px}.voices-panel h2,.browse-panel h2{margin:5px 0 0;font-size:1.35rem}.voices-panel>header>small{color:var(--muted)}
.people-gallery{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.people-gallery article{min-width:0;padding:12px;border:1px solid var(--line);border-radius:16px;background:#111318;transition:transform .18s,border-color .18s}.people-gallery article:hover{transform:translateY(-2px);border-color:rgba(107,80,246,.6)}.people-gallery .person-copy{display:flex;flex-direction:column;align-items:flex-start;gap:9px;width:100%;min-width:0}.people-gallery .person-copy img{width:46px;height:46px;border-radius:50%;object-fit:cover;background:#252a31}.people-gallery .person-copy span{display:grid;width:100%;min-width:0}.people-gallery .person-copy b,.people-gallery .person-copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.people-gallery .follow{width:100%;margin-top:12px;min-height:34px}
.topic-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.topic-gallery button{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:2px 10px;min-width:0;padding:12px;border:1px solid var(--line);border-radius:14px;background:#111318;color:var(--cream);text-align:left;cursor:pointer}.topic-gallery button>span{grid-row:1/3;color:#666d7a;font:700 1.2rem Georgia}.topic-gallery button>b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.topic-gallery button>small{color:var(--muted)}.topic-gallery button:hover,.topic-gallery button.selected{border-color:var(--orange);background:#18152a}.clear-button{padding:7px 11px;border:1px solid var(--line);border-radius:999px;background:none;color:var(--muted);cursor:pointer}
@media(max-width:1050px){.search-hero{grid-template-columns:1fr;gap:26px}.discovery-panels{grid-template-columns:1fr}.people-gallery{grid-template-columns:repeat(5,minmax(135px,1fr));overflow-x:auto;padding-bottom:5px}}
@media(max-width:680px){.explore-hub{gap:12px}.search-hero{display:block;min-height:0;padding:28px 18px 20px;border-left:0;border-right:0;border-radius:0}.hero-copy h1{font-size:clamp(2.35rem,12vw,3.4rem)}.hero-copy p{font-size:.9rem}.hero-search{grid-template-columns:minmax(0,1fr) auto;margin-top:24px;padding:7px}.hero-input{grid-column:1/-1;min-height:52px;border-bottom:1px solid var(--line)}.hero-search select{min-width:0}.hero-search .search-button{padding:0 18px}.discovery-panels{gap:12px}.voices-panel,.browse-panel{padding:20px 16px;border-left:0;border-right:0;border-radius:0}.voices-panel>header>small{display:none}.people-gallery{display:flex;margin:0 -16px;padding:0 16px 8px;scroll-snap-type:x proximity;scrollbar-width:none}.people-gallery::-webkit-scrollbar{display:none}.people-gallery article{flex:0 0 148px;scroll-snap-align:start}.topic-gallery{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* Keep discovery compact so the blugs remain in the first viewport. */
@media(min-width:681px){
  .explore-hub{gap:12px}
  .search-hero{grid-template-columns:minmax(300px,.8fr) minmax(520px,1.2fr);min-height:0;gap:28px;padding:22px 26px;border-radius:20px}
  .search-hero::after{display:none}
  .hero-copy h1{margin:5px 0 0;font-size:clamp(1.75rem,2.5vw,2.55rem);line-height:1;white-space:nowrap}
  .hero-copy p{display:none}
  .hero-search{padding:7px;border-radius:14px;box-shadow:none}
  .hero-search select,.hero-search .search-button{min-height:44px}
  .discovery-panels{grid-template-columns:1.45fr .9fr;gap:12px}
  .voices-panel,.browse-panel{padding:15px 16px;border-radius:18px}
  .voices-panel>header,.browse-panel>header{align-items:center;margin-bottom:10px}
  .voices-panel h2,.browse-panel h2{display:inline;margin:0 0 0 8px;font-size:1rem}
  .voices-panel .eyebrow,.browse-panel .eyebrow{display:inline}
  .voices-panel>header>small{font-size:.75rem}
  .people-gallery{display:flex;gap:8px;overflow-x:auto;padding-bottom:1px;scrollbar-width:none}
  .people-gallery::-webkit-scrollbar{display:none}
  .people-gallery article{display:flex;align-items:center;gap:8px;flex:1 0 145px;padding:8px 9px;border-radius:12px}
  .people-gallery .person-copy{display:grid;grid-template-columns:32px minmax(0,1fr);align-items:center;gap:7px}
  .people-gallery .person-copy img{grid-row:1;width:32px;height:32px}
  .people-gallery .person-copy span{grid-column:2;grid-row:1}
  .people-gallery .person-copy b{font-size:.77rem}.people-gallery .person-copy small{font-size:.68rem}
  .people-gallery .follow{width:auto;min-width:52px;min-height:30px;margin:0;padding:4px 7px;font-size:.62rem}
  .topic-gallery{display:flex;gap:7px;overflow-x:auto;scrollbar-width:none}
  .topic-gallery::-webkit-scrollbar{display:none}
  .topic-gallery button{flex:1 0 82px;display:block;padding:9px 10px;border-radius:11px}
  .topic-gallery button>span{display:none}
  .topic-gallery button>b{display:block;font-size:.78rem}
  .topic-gallery button>small{display:block;margin-top:2px;font-size:.66rem}
}

/* Minimal discovery chrome */
.search-hero{display:block;min-height:0;padding:12px;background:transparent}
.search-hero::after{display:none}
.hero-search{width:100%;grid-template-columns:minmax(0,1fr) 145px auto;box-shadow:none}
.voices-panel>header,.browse-panel>header{align-items:center;min-height:24px}
.people-gallery .follow{display:grid;place-items:center;flex:0 0 30px;width:30px;min-width:30px;height:30px;min-height:30px;margin:0;padding:0;border-radius:50%;font-size:1rem;line-height:1}
.topic-gallery button{display:block;text-align:center}
.topic-gallery button>b{display:block}
.topic-gallery button>small,.topic-gallery button>span{display:none}
.discovery-panels{grid-template-columns:1fr}
@media(max-width:680px){
  .search-hero{padding:10px 12px;border-left:0;border-right:0;border-radius:0}
  .hero-search{grid-template-columns:minmax(0,1fr) auto;margin:0}
  .voices-panel>header,.browse-panel>header{margin-bottom:10px}
  .topic-gallery button{min-height:44px}
}

@media(max-width:680px){
  .explore-mode{gap:8px}
  .explore-hub{gap:8px}
  .search-hero{padding:8px 10px}
  .hero-search{display:grid;grid-template-columns:minmax(0,1fr) 92px 46px;gap:6px;padding:6px;border-radius:14px}
  .hero-input{grid-column:auto;min-height:44px;padding:0 8px;border-bottom:0}
  .hero-input span{font-size:1rem}
  .hero-input input{font-size:.83rem}
  .hero-search select{width:92px;min-height:44px;padding:0 7px;font-size:.72rem}
  .hero-search .search-button{width:46px;min-height:44px;padding:0;font-size:0}
  .hero-search .search-button::after{content:"⌕";font-size:1.15rem}
  .voices-panel{padding:13px 10px 10px}
  .voices-panel>header{margin-bottom:8px;padding:0 2px}
  .people-gallery{gap:7px;margin:0 -10px;padding:0 10px 2px}
  .people-gallery article{display:flex;align-items:center;gap:7px;flex:0 0 166px;min-height:54px;padding:7px 8px;border-radius:12px}
  .people-gallery .person-copy{display:grid;grid-template-columns:34px minmax(0,1fr);align-items:center;gap:7px}
  .people-gallery .person-copy img{grid-column:1;grid-row:1;width:34px;height:34px}
  .people-gallery .person-copy span{grid-column:2;grid-row:1}
  .people-gallery .person-copy b{font-size:.72rem}
  .people-gallery .person-copy small{font-size:.62rem}
  .people-gallery .follow{flex:0 0 28px;width:28px;min-width:28px;height:28px;min-height:28px;font-size:.9rem}
  .explore-mode .feed-heading{padding:8px 14px 2px}
  .explore-mode .feed-heading h2{font-size:1rem}
  .explore-mode .feed-heading .eyebrow{font-size:.62rem}
}
.profile-signals{display:flex;flex-wrap:wrap;gap:8px;padding:0 18px 16px}.profile-signals button{display:flex;align-items:center;gap:8px;padding:8px 11px;border:1px solid rgba(255,255,255,.1);border-radius:12px;background:rgba(9,11,16,.36);color:var(--cream);cursor:pointer;backdrop-filter:blur(12px)}.profile-signals button:hover{border-color:var(--orange);background:rgba(107,80,246,.14)}.profile-signals i{display:grid;place-items:center;width:27px;height:27px;border-radius:9px;background:rgba(107,80,246,.18);color:#a99aff;font-style:normal}.profile-signals span{display:grid;text-align:left}.profile-signals small{color:var(--muted);font-size:.58rem}.profile-signals b{font-size:.72rem}
@media(max-width:620px){.profile-signals{padding:0 14px 13px;gap:6px}.profile-signals button{flex:1;min-width:96px;padding:7px}.profile-signals i{display:none}.profile-signals b{font-size:.66rem}}
/* 2026 glass workspace — Home only */
.page-shell{background:radial-gradient(circle at 12% 4%,rgba(67,51,148,.18),transparent 34%),radial-gradient(circle at 88% 18%,rgba(34,50,78,.2),transparent 32%),linear-gradient(145deg,#080a0f,#0d1017 52%,#090b11)}
.home-revamp{position:relative;width:min(1240px,calc(100% - 40px));grid-template-columns:minmax(0,1fr) 310px;gap:0;margin-top:28px;padding:0;border:1px solid rgba(255,255,255,.1);border-radius:28px;background:rgba(24,27,35,.66);box-shadow:0 32px 90px rgba(0,0,0,.38),inset 0 1px rgba(255,255,255,.04);backdrop-filter:blur(24px);overflow:hidden}
.home-revamp .main-column{padding:24px 26px 34px;border-right:1px solid rgba(255,255,255,.08)}
.home-revamp .identity-card{border-color:rgba(255,255,255,.1);border-radius:22px;background:rgba(13,16,22,.58);box-shadow:0 18px 42px rgba(0,0,0,.22)}
.home-revamp .header-photo{height:150px;filter:saturate(.82) brightness(.78)}
.home-revamp .identity-row{padding:10px 18px 8px}.home-revamp .identity-row h1{font-size:1.12rem}.home-revamp .profile-photo{box-shadow:0 8px 22px rgba(0,0,0,.34)}
.home-revamp .profile-signals{padding-top:4px}.home-revamp .profile-signals button{flex:0 1 auto}
.home-revamp .composer{padding:10px 12px;border-color:rgba(255,255,255,.1);border-radius:18px;background:rgba(13,16,22,.48);box-shadow:none}.home-revamp .composer>button{border-color:rgba(255,255,255,.11);background:rgba(8,10,15,.5)}
.home-revamp .feed-heading{padding:20px 4px 10px}.home-revamp .feed-heading h2{font:700 1.55rem Georgia,serif}.home-revamp .feed-filters{background:rgba(8,10,15,.42)}
.home-revamp .feed{display:grid;gap:12px;overflow:visible;border:0;border-radius:0;background:transparent}.home-revamp .feed :deep(.post-card){border:1px solid rgba(255,255,255,.09);border-radius:18px;background:rgba(15,18,24,.58);transition:transform .18s,border-color .18s,background .18s}.home-revamp .feed :deep(.post-card:hover){transform:translateY(-2px);border-color:rgba(107,80,246,.42);background:rgba(24,27,36,.76)}.home-revamp .feed :deep(.post-image){max-height:340px}
.home-revamp .discovery-column{position:static;align-self:stretch;display:flex;flex-direction:column;gap:18px;padding:24px 20px;background:rgba(11,13,19,.3)}
.home-revamp .search-box{border-color:rgba(255,255,255,.1);background:rgba(8,10,15,.5)}
.home-revamp .topics{border:1px solid rgba(255,255,255,.09);border-radius:18px;background:rgba(17,20,27,.48)}.home-revamp .topics button:hover{background:rgba(107,80,246,.11)}
.home-revamp .about-box{margin-top:auto;border-color:rgba(107,80,246,.3);background:rgba(31,25,54,.48)}
@media(max-width:900px){.home-revamp{grid-template-columns:1fr}.home-revamp .main-column{border-right:0}.home-revamp .discovery-column{display:grid;grid-template-columns:1fr 1fr;border-top:1px solid rgba(255,255,255,.08)}.home-revamp .about-box{margin:0}}
@media(max-width:620px){.page-shell{background:#0a0c11}.home-revamp{width:100%;margin-top:0;border:0;border-radius:0;background:transparent;box-shadow:none;backdrop-filter:none}.home-revamp .main-column{padding:0 0 24px}.home-revamp .identity-card{border-radius:0}.home-revamp .header-photo{height:118px}.home-revamp .feed{padding:0 10px}.home-revamp .feed :deep(.post-card){border-radius:16px}.home-revamp .feed-heading{padding:17px 14px 9px}}

/* Home — warm translucent social workspace */
.page-shell{min-height:100vh;background:radial-gradient(circle at 84% 10%,rgba(139,99,76,.31),transparent 30%),radial-gradient(circle at 16% 78%,rgba(31,38,48,.82),transparent 44%),linear-gradient(118deg,#15181e 0%,#302d32 54%,#55443e 100%);background-attachment:fixed}
.home-revamp{width:min(1260px,calc(100% - 48px));grid-template-columns:minmax(0,1fr) 320px;margin-top:34px;border:1px solid rgba(255,255,255,.2);border-radius:34px;background:rgba(83,75,78,.57);box-shadow:0 36px 90px rgba(15,13,15,.3),inset 0 1px rgba(255,255,255,.12);backdrop-filter:blur(28px) saturate(.9)}
.home-revamp .main-column{padding:24px 28px 38px;border-right:1px solid rgba(255,255,255,.16)}
.home-revamp .identity-card{overflow:visible;border:0;border-bottom:1px solid rgba(255,255,255,.14);border-radius:0;background:transparent;box-shadow:none}
.home-revamp .header-photo{height:118px;border-radius:18px;filter:saturate(.7) brightness(.72);opacity:.86}
.home-revamp .identity-row{min-height:78px;padding:8px}.home-revamp .profile-photo{flex:0 0 62px;width:62px;height:62px;margin-top:0;border:3px solid rgba(214,202,196,.72);box-shadow:0 8px 22px rgba(0,0,0,.22)}
.home-revamp .identity-row h1{font-size:1rem}.home-revamp .identity-row p{color:rgba(245,236,231,.62)}
.home-revamp .identity-copy{flex:0 1 190px;min-width:130px}
.home-revamp .ghost-button{padding:8px 15px;border:0;border-radius:10px;background:rgba(239,225,216,.15);color:#fff;font-size:.75rem}
.profile-actions{display:flex;gap:8px;margin-left:auto}.profile-actions .ghost-button{margin-left:0}.new-blug{padding:8px 15px;border:0;border-radius:10px;background:var(--orange);color:#fff;font-size:.75rem;font-weight:800;cursor:pointer}
.profile-metrics{display:flex;align-items:center;gap:14px;margin-left:clamp(4px,2vw,28px)}.profile-metrics button{display:flex;align-items:baseline;gap:5px;padding:0;border:0;background:none;color:#fff;cursor:pointer}.profile-metrics button b{font-size:.84rem}.profile-metrics button span{color:rgba(244,235,230,.63);font-size:.72rem}.profile-metrics>i{width:1px;height:13px;background:rgba(255,255,255,.19)}
.home-revamp .composer{display:flex;margin:0;padding:18px 8px;border:0;border-bottom:1px solid rgba(255,255,255,.14);border-radius:0;background:transparent}
.home-revamp .composer>img{flex:0 0 34px;width:34px;height:34px}
.composer-head{display:flex;align-items:center;gap:9px;margin-bottom:11px}.composer-head img{width:32px;height:32px;border-radius:50%;object-fit:cover}.composer-head b{font-size:.78rem}.composer-head button{margin-left:auto;padding:7px 22px;border:0;border-radius:11px;background:rgba(240,224,214,.25);color:#fff;font-size:.7rem;font-weight:800;cursor:pointer}
.home-revamp .composer-input{display:block;width:auto;min-height:42px;padding:0 14px;border:0;border-radius:9px;background:rgba(36,30,33,.43);color:rgba(255,255,255,.65);text-align:left;cursor:text}
.composer-post{flex:0 0 auto;padding:0 20px;border:0;border-radius:10px;background:rgba(239,225,216,.2);color:#fff;font-weight:800;cursor:pointer}
.composer-tools{display:flex;align-items:center;gap:8px;margin-top:10px}.composer-tools button{padding:6px 10px;border:0;border-radius:9px;background:rgba(238,225,218,.18);color:rgba(255,255,255,.86);font-size:.67rem;cursor:pointer}.composer-tools .reply-control{margin-left:auto;background:rgba(35,30,32,.25)}
.home-revamp .feed-heading{padding:20px 7px 9px}.home-revamp .feed-heading h2{font:700 1.3rem/1.1 Georgia,serif}.home-revamp .feed-filters{padding:2px;border:0;border-radius:10px;background:rgba(31,27,29,.38)}.home-revamp .feed-filters button{padding:6px 12px;border-radius:8px}.home-revamp .feed-filters .active{background:rgba(239,225,216,.22);color:#fff}
.home-revamp .feed{gap:0}.home-revamp .feed :deep(.post-card){padding:20px 8px;border:0;border-top:1px solid rgba(255,255,255,.14);border-radius:0;background:transparent}.home-revamp .feed :deep(.post-card:hover){transform:none;border-color:rgba(255,255,255,.18);background:rgba(255,255,255,.035)}.home-revamp .feed :deep(.post-image){border-radius:14px}.home-revamp .feed :deep(.post-content h2){font-size:1.4rem}
.home-revamp .discovery-column{gap:0;padding:24px 22px;background:transparent}
.home-revamp .search-box{margin-bottom:22px;padding:10px 12px;border:0;border-radius:10px;background:rgba(35,30,32,.4)}
.suggestions{padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,.14)}.suggestions header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.suggestions header b{font-size:.78rem}.suggestions header button{padding:6px 11px;border:0;border-radius:9px;background:rgba(238,225,218,.16);color:#fff;font-size:.65rem;cursor:pointer}.suggestions article{display:flex;align-items:center;gap:9px;padding:8px 0}.suggestions article>img{width:34px;height:34px;border-radius:50%;object-fit:cover}.suggestion-name{display:grid;min-width:0;flex:1;padding:0;border:0;background:none;color:#fff;text-align:left;cursor:pointer}.suggestion-name b,.suggestion-name small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.suggestion-name b{font-size:.73rem}.suggestion-name small{color:rgba(245,236,231,.56);font-size:.62rem}.suggestion-follow{padding:0;border:0;background:none;color:#fff;font-size:.68rem;font-weight:800;cursor:pointer}
.home-revamp .topics{margin-top:20px;border:0;border-radius:0;background:transparent}.home-revamp .topics header{padding:0 0 9px}.home-revamp .topics header .eyebrow{display:none}.home-revamp .topics h3{margin:0;font-size:.8rem}.home-revamp .topics button{padding:11px 0;border-top:1px solid rgba(255,255,255,.12)}.home-revamp .topics button:hover{padding-left:6px;background:rgba(255,255,255,.035)}.home-revamp .topics button b{font-size:.73rem}.home-revamp .topics button small{font-size:.62rem;color:rgba(245,236,231,.53)}.home-revamp .topics button>span{color:#fff;font-size:1rem}
@media(max-width:900px){.home-revamp{grid-template-columns:1fr}.home-revamp .main-column{border-right:0}.home-revamp .discovery-column{display:none}}
@media(max-width:760px){.home-revamp .identity-row{flex-wrap:wrap}.home-revamp .identity-copy{flex:1}.profile-actions{margin-left:auto}.profile-metrics{order:4;width:100%;margin:4px 0 0 76px}}
@media(max-width:620px){.page-shell{background:linear-gradient(155deg,#171a20,#302d32 62%,#4a3c37)}.home-revamp{width:100%;margin:0;border:0;border-radius:0;background:rgba(31,30,35,.78)}.home-revamp .main-column{padding:0 14px 90px}.home-revamp .identity-card{padding-top:14px}.home-revamp .header-photo{height:102px;border-radius:14px}.home-revamp .identity-row{padding-left:3px;padding-right:3px}.home-revamp .ghost-button{padding:7px 10px}.profile-metrics{gap:9px;margin-left:0}.profile-metrics button{gap:3px}.profile-metrics button span{font-size:.62rem}.home-revamp .composer{padding-left:3px;padding-right:3px}.composer-tools{overflow-x:auto}.composer-tools button{white-space:nowrap}.composer-tools .reply-control{margin-left:0}.home-revamp .feed{padding:0}.home-revamp .feed-heading{padding-left:3px;padding-right:3px}.home-revamp .feed :deep(.post-card){padding-left:3px;padding-right:3px}.home-revamp .feed :deep(.post-content h2){font-size:1.22rem}}

/* Opaque cream Home theme */
.page-shell{background:#f3eee5}.home-revamp{background:#fffaf0;border-color:#d8cdbc;box-shadow:0 14px 34px rgba(55,43,29,.1);backdrop-filter:none;color:#201d19}.home-revamp .main-column,.home-revamp .identity-card,.home-revamp .composer,.suggestions{border-color:#d8cdbc}.home-revamp .discovery-column{background:#fbf4e8}.home-revamp .identity-card,.home-revamp .composer,.home-revamp .feed :deep(.post-card),.home-revamp .topics{background:transparent}.home-revamp .identity-row h1,.home-revamp .profile-metrics button,.suggestion-name,.suggestion-follow,.home-revamp .topics button{color:#201d19}.home-revamp .identity-row p,.profile-metrics button span,.suggestion-name small,.home-revamp .topics button small{color:#625c54}.home-revamp .ghost-button,.suggestions header button{background:#eee4d5;color:#201d19}.new-blug{background:#d62828}.home-revamp .search-box{background:#f2eadf}.home-revamp .search-box input{color:#201d19}.home-revamp .feed-filters{background:#eee4d5}.home-revamp .feed-filters .active{background:#fffaf0;color:#201d19}.home-revamp .feed :deep(.post-card:hover),.home-revamp .topics button:hover{background:#f7efe3}.home-revamp .topics button>span{color:#d62828}@media(max-width:620px){.page-shell,.home-revamp{background:#fffaf0}.home-revamp{color:#201d19}}
.global-banner{width:min(1260px,calc(100% - 40px));margin:24px auto 0}.home-revamp{grid-template-columns:165px minmax(0,720px) 280px}.left-ad-rail{display:grid;align-content:start;gap:16px;padding:24px 14px;border-right:1px solid var(--line);background:#fbf4e8}.left-ad-rail :deep(.ad-sidebar){min-height:210px}.home-revamp .identity-card{position:relative}.header-search{position:absolute;top:16px;right:16px;display:flex;align-items:center;gap:8px;width:min(290px,42%);padding:10px 13px;border:1px solid rgba(255,255,255,.72);border-radius:11px;background:rgba(255,250,240,.94);box-shadow:0 8px 24px rgba(30,24,18,.12)}.header-search input{width:100%;border:0;outline:0;background:none;color:#201d19}.home-revamp .discovery-column>.ad-slot:first-child{min-height:250px;margin-bottom:20px}.topic-pills{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:4px 0}.home-revamp .topics .topic-pills button{display:flex;align-items:center;gap:8px;padding:10px;border:1px solid var(--line);border-radius:11px;background:#fffaf0}.topic-pills i{font-style:normal;color:#d62828}.topic-pills button:nth-child(2n) i{color:#267a3f}.topic-pills button:nth-child(3n) i{color:#315fb5}.topic-pills button:nth-child(4n) i{color:#9a6500}.topic-pills b{font-size:.78rem}
@media(max-width:1120px){.home-revamp{grid-template-columns:minmax(0,1fr) 280px}.left-ad-rail{display:none}}
@media(max-width:900px){.global-banner{width:100%;margin-top:12px}.header-search{width:min(260px,48%)}.home-revamp{grid-template-columns:1fr}}
@media(max-width:620px){.header-search{top:24px;right:24px;width:58%;padding:8px 10px}.global-banner{margin-top:0}}

/* Dark mode contrast: keep every Explore surface and its descendants on the
   same opaque charcoal palette. These live here so scoped light rules cannot
   override the global theme after component CSS is injected. */
:global(html[data-theme="dark"] .explore-mode){background:transparent!important;color:var(--text)!important}
:global(html[data-theme="dark"] .search-hero),
:global(html[data-theme="dark"] .voices-panel),
:global(html[data-theme="dark"] .people-gallery article),
:global(html[data-theme="dark"] .hero-search),
:global(html[data-theme="dark"] .hero-search select){background:#242321!important;border-color:#5b554d!important;color:#f7f0e8!important;box-shadow:none!important}
:global(html[data-theme="dark"] .hero-input input){background:transparent!important;color:#f7f0e8!important}
:global(html[data-theme="dark"] .hero-input input::placeholder){color:#aaa198!important;opacity:1}
:global(html[data-theme="dark"] .people-gallery article :is(b,small)),
:global(html[data-theme="dark"] .person-copy){color:#f7f0e8!important}
:global(html[data-theme="dark"] .people-gallery article small){color:#c1b8ae!important}
:global(html[data-theme="dark"] .people-gallery article:hover){background:#302e2a!important;border-color:#766d63!important}
:global(html[data-theme="dark"] .follow){background:#242321!important;color:#ff7777!important;border-color:#ff6868!important}
:global(html[data-theme="dark"] .follow:hover),
:global(html[data-theme="dark"] .follow:focus-visible){background:#3b2928!important;color:#fff!important;border-color:#ff8a8a!important}
:global(html[data-theme="dark"] .search-button){background:#e33434!important;color:#fff!important}
:global(html[data-theme="dark"] .search-button:hover){background:#ff4b4b!important}
</style>
