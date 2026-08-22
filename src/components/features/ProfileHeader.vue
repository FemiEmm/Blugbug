<template>
  <div class="profile-header">
    <!-- Top Row -->
    <div class="top-row">
      <div class="header-image-container">
        <img :src="headerImage" alt="Header Image" class="header-image" loading="lazy" />
        <label v-if="!disableUpload" class="upload-header-icon">
          <i class="fas fa-camera"></i>
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="uploadProfileImage($event, 'header')" />
        </label>
      </div>
      <div class="profile-picture-container">
        <div class="profile-picture-circle">
          <img :src="profilePicture" alt="Profile Picture" class="profile-image" loading="lazy" />
          <label v-if="!disableUpload" class="upload-icon">
            <i class="fas fa-camera"></i>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden @change="uploadProfileImage($event, 'profile')" />
          </label>
        </div>
      </div>
    </div>

    <!-- Bottom A Row -->
    <div class="bottom-row bottom-a">
      <!-- A-left Column -->
      <div class="info-column">
        <div class="name-container">
          <div class="name-wrapper">
            <h1 class="name">{{ user.fullName }}</h1>
            <div v-if="checkmarkIconUrl" class="checkmark-icon-circle">
              <img :src="checkmarkIconUrl" alt="Checkmark Icon" class="checkmark-icon" />
            </div>
          </div>
          <p class="chatter-name">@{{ user.chatterName }}</p>
        </div>
        <p class="about-me">{{ user.aboutMe }}</p>
        <div class="stats-container">
          <p>
            <strong>{{ formatCount(totalLikes) }}</strong> Likes
            <strong>{{ formatCount(totalBookmarks) }}</strong> Bookmarks
            <strong class="followers-button" @click="navigateToFollowing">{{ user.following }} Following</strong>
            <strong class="followers-buttons" @click="navigateToFollowers">{{ user.followers }} Followers</strong>
          </p>
        </div>
      </div>

      <!-- A-right Column -->
      <div class="action-column">
        <button class="create-blug-button" @click="navigateToCreateBlogPostPage">
          <font-awesome-icon :icon="['fas', 'pen-clip']" />
        </button>
      </div>
    </div>

    <!-- Bottom B Row -->
    <div class="bottom-row bottom-b">
      <!-- Removed "My Interests" text -->
      <div class="interest-container">
        <!-- Loop through each interest and display it in a colored box -->
        <span
          v-for="(interest, index) in user.interests"
          :key="index"
          :class="['interest-box', getColorClass(index)]"
        >
          {{ interest }}
        </span>
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { getUser } from '../../api/users';
import { listPosts } from '../../api/posts';
import { uploadImage } from '../../api/uploads';

interface User {
  fullName: string;
  chatterName: string;
  aboutMe: string;
  id: string;
  profile_image_url: string;
  header_image_url: string;
  checkmark_url: string | null;
  followers: number;
  following: number;
  interests: string[];
}

export default defineComponent({
  name: 'ProfileHeader',
  props: {
    userId: {
      type: String,
      required: true,
    },
    disableUpload: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const router = useRouter();

    const user = ref<User>({
      fullName: 'Default Name',
      chatterName: '',
      aboutMe: '',
      id: '',
      profile_image_url: '/Default_pfp.svg',
      header_image_url: '/Default_Header.svg',
      checkmark_url: null,
      followers: 0,
      following: 0,
      interests: [],
    });
    const totalLikes = ref(0);
    const totalBookmarks = ref(0);
    const showFileUpload = ref(false);
    const uploadType = ref<'profile' | 'header' | 'checkmark'>('profile');
    const profilePicture = ref<string>('/Default_pfp.svg');
    const headerImage = ref<string>('/Default_Header.svg');
    const checkmarkIconUrl = ref<string | null>(null);

    const fetchUserData = async () => {
      const cachedData = localStorage.getItem(`user_data_${props.userId}`);
      if (cachedData) {
        user.value = JSON.parse(cachedData);
        profilePicture.value = user.value.profile_image_url;
        headerImage.value = user.value.header_image_url;
        checkmarkIconUrl.value = user.value.checkmark_url;
      }

      try {
        const { user: data } = await getUser(props.userId);
        user.value = {
          fullName: data.full_name,
          chatterName: data.chatter_name,
          aboutMe: data.about_me,
          id: data.id,
          profile_image_url: data.profile_image_url || '/Default_pfp.svg',
          header_image_url: data.header_image_url || '/Default_Header.svg',
          checkmark_url: null,
          followers: 0,
          following: 0,
          interests: [],
        };
        profilePicture.value = user.value.profile_image_url;
        headerImage.value = user.value.header_image_url;
        checkmarkIconUrl.value = user.value.checkmark_url;

        localStorage.setItem(`user_data_${props.userId}`, JSON.stringify(user.value));

        await fetchTotalLikesAndBookmarks();
      } catch (error) { console.error(error); }
    };

    const fetchTotalLikesAndBookmarks = async () => {
      await listPosts(props.userId);
      totalLikes.value = 0;
      totalBookmarks.value = 0;
    };

    const showFileUploadModal = (type: 'profile' | 'header' | 'checkmark') => {
      if (!props.disableUpload) {
        uploadType.value = type;
        showFileUpload.value = true;
      }
    };

    const closeFileUploadModal = () => {
      showFileUpload.value = false;
    };

    const uploadProfileImage = async (event: Event, purpose: 'profile' | 'header') => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try { await uploadImage(file, purpose); await fetchUserData(); }
      catch (error) { console.error(error); }
    };

    const navigateToCreateBlogPostPage = () => {
      router.push({ name: 'CreateBlogPostPage' });
    };

    const formatCount = (count: number) => {
      if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'm';
      } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
      } else {
        return count.toString();
      }
    };

    const navigateToFollowers = () => {
      router.push({ path: '/connections', query: { tab: 'followers' } });
    };

    const navigateToFollowing = () => {
      router.push({ path: '/connections', query: { tab: 'following' } });
    };

    const getColorClass = (index: number) => {
      const colors = ['red-bg', 'blue-bg', 'purple-bg', 'green-bg', 'yellow-bg'];
      return colors[index % colors.length];
    };

    watch(() => props.userId, fetchUserData, { immediate: true });

    return {
      user,
      showFileUploadModal,
      closeFileUploadModal,
      navigateToCreateBlogPostPage,
      showFileUpload,
      uploadType,
      fetchUserData,
      profilePicture,
      headerImage,
      checkmarkIconUrl,
      totalLikes,
      totalBookmarks,
      formatCount,
      navigateToFollowers,
      navigateToFollowing,
      getColorClass,
      uploadProfileImage,
    };
  },
});
</script>

<style scoped>
.profile-header {
  text-align: left;
  margin: 0;
  background-color: #2b3138;
  overflow: hidden;
  /* border: solid 5px #0c1118; */
  display: flex;
  flex-direction: column;
  border-radius: 90px 0px 0px 0px;
}

/* Top Row Styling */
.top-row {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.header-image-container {
  width: 100%;
  height: 200px;
  position: relative;
  background-color: #f0f0f0;
  border-radius: 90px 0px 0px 90px;
}

.header-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 90px 0px 0px 90px;
}

.upload-header-icon {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-header-icon:hover {
  opacity: 1;
}

.profile-picture-container {
  position: absolute;
  top: 18px;
  left: 20px;
  width: 150px;
  height: 150px;
  z-index: 1;
}

.profile-picture-circle {
  width: 100%;
  height: 100%;
  background-color: #fff;
  border-radius: 50%;
  border: 3px solid rgb(255, 255, 255);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.upload-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-icon:hover {
  opacity: 1;
}

/* Bottom A Row Styling */
.bottom-row {
  display: flex;
  width: 100%;
  margin-top: 0px;
  margin-bottom: 0px;
  border-bottom: 1px solid rgb(0, 0, 0);
}

.info-column {
  width: 70%;
  padding: 20px;
  color: #ffffff;
}

.name-container {
  margin-bottom: 10px;
  width: 100%;
  
}

.name-wrapper {
  display: flex;
  align-items: center;
}

.name {
  font-size: 24px;
  color: #cebfad;
  margin-right: 10px;
  font-weight: bold;
}

.chatter-name {
  font-size: 18px;
  color: #cebfad;
  margin-top: 10px;
}

.about-me {
  font-size: 14px;
  color: gray;
  margin-bottom: 0px;
  margin-top: 0px;
}

.stats-container {
  font-size: 14px;
  color: #cebfad;
  margin-top: 10px;
}

.followers-button {
  background-color: transparent;
  border: none;
  color: #cebfad;
  cursor: pointer;
  margin-left: 0px;
}

.followers-buttons {
  background-color: transparent;
  border: none;
  color: #cebfad;
  cursor: pointer;
  margin-left: 5px;
}

.followers-button:hover {
  color: #fd662f;
}

.checkmark-icon-circle {
  width: 15px;
  height: 15px;
  background-color: #fff;
  border-radius: 50%;
  border: 1px solid whitesmoke;
  margin-top: 5px;
}

.checkmark-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Bottom B Row Styling */
.bottom-b {
  display: flex;
  flex-direction: column;
  align-items: left;
  width: 100%;
  margin-top: 0px;
  margin-left: px;
  
}

.interest-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: left;
  align-items: center;
  margin-bottom: 10px;
  margin-left: 15px;
  margin-top: 10px;
}

.interest-box {
  color: white;
  padding: 10px;
  border-radius: 5px;
  text-align: center;
  flex: 1 1 auto; /* Flexbox settings to auto adjust width */
  min-width: 80px;
  max-width: 100px;
  word-wrap: break-word;
  font-size: 12px;
}

/* Color classes for interests */
.red-bg {
  background-color: #0c1118;
}

.blue-bg {
  background-color: #0c1118;
}

.purple-bg {
  background-color: #0c1118;
}

.green-bg {
  background-color: #0c1118;
}

.yellow-bg {
  background-color: #0c1118;
}

/* General Styles */
.action-column {
  width: 30%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-blug-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #fd662f;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border: 2px solid #cebfad;
}

.create-blug-button:hover {
  background-color: #e04a2e;
  transform: scale(1.1);
}

/* Media Queries for smaller screens */
@media screen and (max-width: 767px) {
  .header-image-container {
    width: 100%;
    height: 100px;
    position: relative;
    background-color: #f0f0f0;
    border-radius: 90px 0px 0px 90px;
  }

  .profile-picture-container {
    position: absolute;
    top: 8px;
    left: 10px;
    width: 80px;
    height: 80px;
    z-index: 1;
  }

  .profile-header {
    padding: 10px;
    align-items: center;
    border-radius: 70px 0px 0px 0px;
  }

  .top-row {
    align-items: center;
  }

  .bottom-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-top: 0px;
  }

  .info-column,
  .action-column {
    width: 100%;
    text-align: center;
    margin-bottom: 0px;
  }

  .create-blug-button {
    border-radius: 50%;
    width: 50px;
    height: 50px;
    margin-top: -15px;
    margin-bottom: 10px;
    border: none;
    font-size: 15px;
    position: fixed;
    bottom: 20px;
    left: 185px;
    z-index: 9999;
  }

  .create-blug-button:hover {
    border: 3px solid rgb(248, 247, 245);
    transform: scale(1.1);
  }

  .stats-container,
  .about-me,
  .interest {
    text-align: left;
    font-size: 16px;
  }

  .followers-button {
    margin-top: 0px;
  }

  .name-container {
    margin-top: 0px;
    text-align: left;
    display: flex;
    justify-content: left;
    align-items: left;
    gap: 10px;
   
  }

  .name-wrapper {
    justify-content: left;
  }

  .name {
    font-weight: bold;
    text-align: center;
    margin-right: 0;
    font-size: 25px;
  }

  .chatter-name {
    text-align: center;
    margin-top: 5px;
    font-size: 15px;
  }

  .interest-container {
    display: none;
    flex-wrap: wrap;
    justify-content: center;
    width: 100%;
    margin-top: 0px;
    /* border-top: 1px solid #cebfad; */
  }

  .interest-box {
    flex: 1 0 auto;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    text-align: center;
    margin-top: 0px;
  }

  .checkmark-icon-circle {
    width: 15px;
    height: 15px;
    background-color: #fff;
    border-radius: 50%;
    padding: 1px;
    margin-left: 5px;
  }

  .checkmark-icon {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
  }

  .red-bg, .blue-bg, .purple-bg, .green-bg, .yellow-bg {
    background-color: #2b3138;
    font-size: 12px;
  }
}

@media screen and (max-width: 767px) {
  .name-container {
    display: flex;
    flex-direction: column; /* Stack elements vertically */
    align-items: left; /* Center align text horizontally */
    text-align: left; /* Center align text */
  }

  .name-wrapper {
    display: flex;
    flex-direction: column; /* Stack elements vertically */
    align-items: left; /* Center align elements */
  }

  .name {
    
    font-size: 20px; /* Adjust font size for smaller screens */
    margin-bottom: 0px; /* Add space between fullName and chatterName */
  }

  .chatter-name {
    font-size: 16px; /* Adjust font size for smaller screens */
    margin-top: 0; /* Remove margin for cleaner stacking */
  }
}


@media screen and (max-width: 430px) {
  .create-blug-button {
    border-radius: 50%;
    width: 50px;
    height: 50px;
    margin-top: -15px;
    margin-bottom: 10px;
    border: none;
    font-size: 15px;
    position: fixed;
    bottom: 20px;
    left: 190px;
    z-index: 9999;
  }
}

@media screen and (max-width: 390px) {
  .create-blug-button {
    border-radius: 50%;
    width: 50px;
    height: 50px;
    margin-top: -15px;
    margin-bottom: 10px;
    border: none;
    font-size: 15px;
    position: fixed;
    bottom: 20px;
    left: 170px;
    z-index: 9999;
  }
}

@media screen and (max-width: 375px) {
  .create-blug-button {
    border-radius: 50%;
    width: 50px;
    height: 50px;
    margin-top: -15px;
    margin-bottom: 10px;
    border: none;
    font-size: 15px;
    position: fixed;
    bottom: 20px;
    left: 165px;
    z-index: 9999;
  }
}

@media screen and (max-width: 360px) {
  .create-blug-button {
    border-radius: 50%;
    width: 50px;
    height: 50px;
    margin-top: -15px;
    margin-bottom: 10px;
    border: none;
    font-size: 15px;
    position: fixed;
    bottom: 20px;
    left: 155px;
    z-index: 9999;
  }
}
</style>
