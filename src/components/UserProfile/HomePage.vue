<template>
  <div class="new-user-page">
    <NavBar />
    <div class="content">
      <div class="left-column">
        <ProfileHeader 
          :userId="userId" 
          :totalLikes="totalLikes" 
          :totalBookmarks="totalBookmarks"
          :followingCount="followingCount" 
          :followersCount="followersCount"
        />
        <div class="feed-container">
          <Feed />
        </div>
      </div>
    </div>
    
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import NavBar from '../NavBar.vue';
import ProfileHeader from '../features/ProfileHeader.vue';
import Feed from '../features/FeedPage.vue';
import { getUser } from '../../api/users';
import { authStore } from '../../stores/auth';

interface User {
  id: string;
  fullName: string;
  chatterName: string;
  aboutMe: string;
  email: string;
  profile_image_url: string;
  header_image_url: string;
}

export default defineComponent({
  name: 'HomePage',
  components: {
    NavBar,
    ProfileHeader,
    Feed,
  },
  setup() {
    const userId = authStore.user.value?.id || '';
    const user = ref<User | null>(null);
    const totalLikes = ref<number>(0);
    const totalBookmarks = ref<number>(0);
    const followingCount = ref<number>(0);
    const followersCount = ref<number>(0);


    const fetchUserData = async () => {
      try {
        const { user: data } = await getUser(userId);
        user.value = {
          id: data.id,
          fullName: data.full_name,
          chatterName: data.chatter_name,
          aboutMe: data.about_me,
          email: data.email,
          profile_image_url: data.profile_image_url || '/public/Default_pfp.svg',
          header_image_url: data.header_image_url || '/public/default-header-image-path',
        };
      } catch (error) { console.error(error); }
    };


    onMounted(() => {
      fetchUserData();
    });

    return {
      userId,
      user,
      totalLikes,
      totalBookmarks,
      followingCount,
      followersCount,
    };
  },
});
</script>

<style scoped>
.new-user-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #000000;
  padding-right: 50px;
  padding-left: 50px;
  padding-top: 70px;
}

.navbar {
  flex-shrink: 0;
}

.content {
  display: flex;
  flex-grow: 1;
  width: 100%;
  position: relative;
}

.left-column {
  width: 63.9%;
  overflow-y: auto;
  height: 100%;
}

.feed-container {
  padding: 0px;
  /* border: solid 5px #0c1118; */
  padding-right: 70px;
  padding-left: 10px;
}

.header-toggle {
  display: flex;
  justify-content: space-around;
  cursor: pointer;
  background-color: #2b3138;
  padding: 10px;
  color: #cebfad;
  /* border: solid 5px #0c1118; */
}

.header-toggle h3 {
  margin: 0 10px;
  cursor: pointer;
}

.header-toggle h3:hover {
  color: #f53;
}

.header-toggle h3.active {
  color: rgb(255, 255, 255);
  border-bottom: 2px solid rgb(255, 255, 255);
}

.right-column {
  width: 35%;
  background-color: #1e2127;
  max-height: calc(100vh - 63px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 63px;
  right: 0;
  margin-right: 30px;
  transition: right 0.3s ease-in-out;
  border-left: 1px solid black;
 
}

.right-column-visible {
  right: 0;
}

.toggle-button {
  display: none;
}

h3 {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-left: 10px;
  max-height: 80px;
  padding: 10px;
}



@media (max-width: 380px) {
  .new-user-page {
    padding-right: 1px;
    padding-left: 1px;
    margin-top: 50px;
  }

  .content {
    flex-direction: column;
  }

  .left-column,
  .right-column {
    width: 100%;
    overflow-y: auto;
    height: auto;
  }

  .navbar {
    max-width: 100%;
  }

  .feed-container {
    padding: 0px;
    border: solid 5px #0c1118;
    padding-right: 10px;
    padding-left: 10px;
  }

  .right-column {
    width: 100%;
    right: -100%;
    margin-top: 100px;
    margin-right: 1px;
    height: 480px;
    z-index: 9999;
  }

  .right-column-visible {
    right: 0;
  }

  .toggle-button {
    display: flex;
    position: fixed;
    top: 20px;
    right: 20px;
    font-size: 30px;
    cursor: pointer;
    z-index: 10000;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: none;
    color: #f53;
  }
}

@media (min-width: 380px) and (max-width: 480px) {
  .new-user-page {
    padding-right: 1px;
    padding-left: 1px;
    margin-top: 50px;
  }

  .content {
    flex-direction: column;
  }

  .left-column,
  .right-column {
    width: 100%;
    overflow-y: auto;
    height: auto;
  }

  .navbar {
    max-width: 100%;
  }

  .feed-container {
    padding: 0px;
    border: solid 5px #0c1118;
    padding-right: 10px;
    padding-left: 10px;
  }

  .right-column {
    width: 100%;
    right: -100%;
    margin-top: 100px;
    margin-right: 1px;
    height: 680px;
    z-index: 9999;
  }

  .right-column-visible {
    right: 0;
  }

  .toggle-button {
    display: flex;
    position: fixed;
    top: 20px;
    right: 25px;
    font-size: 30px;
    cursor: pointer;
    z-index: 10000;
    align-items: center;
    justify-content: center;
    background-color: transparent;
    border: none;
    color: #f53;
  }
}

@media (min-width: 481px) and (max-width: 780px) {
  .new-user-page {
    padding-right: 1px;
    padding-left: 1px;
    margin-top: 30px;
  }

  .content {
    flex-direction: column;
  }

  .left-column,
  .right-column {
    width: 100%;
    overflow-y: auto;
    height: auto;
  }

  .navbar {
    max-width: 100%;
  }

  .feed-container {
    padding: 0px;
    border: solid 5px #0c1118;
    padding-right: 10px;
    padding-left: 10px;
  }

  .right-column {
    width: 65%;
    right: -100%;
    margin-top: 110px;
    z-index: 9999;
  }

  .right-column-visible {
    right: 0;
  }

  .toggle-button {
    display: flex;
    position: fixed;
    top: 80px;
    right: 20px;
    font-size: 40px;
    background-color: rgb(0, 0, 0);
    color: #cebfad;
    padding: 10px;
    border-radius: 40px;
  }
}

@media (min-width: 780px) and (max-width: 1024px) {
  .new-user-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #000000;
    padding-right: 10px;
    padding-left: 10px;
    padding-top: 2px;
  }

  .right-column {
    margin-top: 19px;
    height: 100%;
  }
}

::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: var(--color-background-soft);
}

::-webkit-scrollbar-thumb {
  background-color: red;
  border-radius: 10px;
  border: 3px solid var(--color-background-soft);
}

* {
  scrollbar-width: thin;
  scrollbar-color: red var(--color-background-soft);
}

::-ms-scrollbar {
  width: 12px;
}

::-ms-scrollbar-track {
  background: var(--color-background-soft);
}

::-ms-scrollbar-thumb {
  background-color: red;
  border-radius: 10px;
  border: 3px solid var(--color-background-soft);
}

html {
  scroll-behavior: smooth;
}
</style>
