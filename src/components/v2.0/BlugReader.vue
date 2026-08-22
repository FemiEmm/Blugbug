<template>
  <div v-if="isLoading" class="loading-page">
    <!-- Display a loading indicator while the page is loading -->
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
  <div v-else class="blug-reader">
    <NavBar />
    <button @click="goBack" class="back-button">
          <i class="fas fa-arrow-left"></i> <!-- Font Awesome icon for the back arrow -->
        </button>
    <div class="header-display">
      <img v-if="headerImageUrl" :src="headerImageUrl" alt="Blog Header Image" class="header-image" />
    </div>
    <div class="blug-content" v-html="post?.content"></div>
    <LocalInteractions v-if="post" :postId="post.id" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getPost } from '../../api/posts';
import NavBar from '../../components/NavBar.vue';
import LocalInteractions from '../LocalInteractions.vue';

interface Post {
  id: string;
  title: string;
  content: string;
  likes: number;
  user: string;
  userFullName: string;
  date: string;
  bookmarked_by: string[];
}

export default defineComponent({
  name: 'BlugReader',
  components: {
    NavBar,
    LocalInteractions,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const post = ref<Post | null>(null);
    const isLoading = ref(true);
    const headerImageUrl = ref<string | null>(null); // Reactive property for the header image URL
    const interactivePageRef = ref<HTMLElement | null>(null);

    const clearAndSetBlogIdInLocalStorage = (blogId: string) => {
      localStorage.removeItem('blog_id');
      localStorage.setItem('blog_id', blogId);
    };

    const loadPost = async (blogId: string) => {
      try {
        const { post: data } = await getPost(blogId);
        post.value = {
          id: data.id,
          title: data.title,
          content: data.content,
          likes: 0,
          user: data.user_id,
          userFullName: data.full_name || data.chatter_name || 'Local user',
          date: data.created_at,
          bookmarked_by: [],
        };
        headerImageUrl.value = data.header_image_url || null;
        setMetaTags(data.title, '', null);
        clearAndSetBlogIdInLocalStorage(data.id);
      } catch (error) { console.error(error); }
      finally { isLoading.value = false; }
    };

    const setMetaTags = (title: string, description: string, imageUrl: string | null) => {
      document.title = title;

      const metaTags = [
        { property: 'og:title', content: title },
        { property: 'og:description', content: description },
        { property: 'og:image', content: imageUrl || '' },
        { property: 'og:url', content: window.location.href },
        { property: 'og:type', content: 'article' },
      ];

      metaTags.forEach(tag => {
        let metaElement = document.querySelector(`meta[property="${tag.property}"]`);
        if (metaElement) {
          metaElement.setAttribute('content', tag.content);
        } else {
          metaElement = document.createElement('meta');
          metaElement.setAttribute('property', tag.property);
          metaElement.setAttribute('content', tag.content);
          document.head.appendChild(metaElement);
        }
      });
    };

    const clearLocalStorageOnNavigate = () => {
      localStorage.removeItem('blog_id');
    };

    const toggleBookmark = async () => {
      if (!post.value) return;
      return;
    };

    const autoScrollToInteractivePage = () => {
      if (interactivePageRef.value) {
        interactivePageRef.value.scrollIntoView({ behavior: 'smooth' });
      }
    };

    onMounted(() => {
      const blogId = route.query.blogId as string;
      loadPost(blogId);
    });

    watch(
      () => route.query.blogId,
      (newBlogId, oldBlogId) => {
        if (newBlogId !== oldBlogId) {
          loadPost(newBlogId as string);
          autoScrollToInteractivePage();
        }
      }
    );

    const goBack = () => {
      router.back(); // Use Vue Router's back method to navigate to the previous page
    };

    onBeforeUnmount(() => {
      clearLocalStorageOnNavigate();
    });

    return {
      post,
      isLoading,
      headerImageUrl, // Return the header image URL
      toggleBookmark,
      interactivePageRef,
      goBack,
    };
  },
});
</script>

<style scoped>
.blug-reader {
  padding: 0px;
  background-color: #2b3138;
  color: #cebfad;
  border: solid 5px #0c1118;
  margin-top: 70px;
  height: 100%;
  margin-right: 50px;
  margin-left: 50px;
}

.header-image {
  width: 50%;
  max-height: 300px;
  object-fit: contain;
  margin-bottom: -40px;
  margin-top: 20px;
}

.header-display {
  text-align: center;
}

.blug-content {
  margin-top: 20px;
  line-height: 1.6;
  padding: 20px 150px ;
}

.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #2b3138;
  color: #cebfad;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #fd662f;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.bookmark-button {
  padding: 10px 20px;
  border: none;
  background-color: #fd662f;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}

.bookmark-button:hover {
  background-color: #e04a2e;
}

.custom-img-class {
  width: 60%;
  height: 300px;
  object-fit: cover;
  display: block;
  margin: 0 auto;
  overflow: hidden;
}

.back-button {
  margin-left: 150px;
  margin-top: 30px;
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center; /* Center the content */
  background-color: #fd662f;
  width: 40px; /* Equal width */
  height: 40px; /* Equal height */
  border-radius: 50%; /* Makes it a perfect circle */
  margin-bottom: 20px; /* Spacing below the back button */
}


/* CSS for iPad screen size */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

/* CSS for phone screen size */
@media screen and (max-width: 767px) {
  .blug-reader {
    padding: 0px;
    background-color: #2b3138;
    color: #cebfad;
    border: solid 5px #0c1118;
    margin-top: 120px;
    height: 100%;
    margin-right: 2px;
    margin-left: 2px;
  }

  .blug-content {
  margin-top: 20px;
  line-height: 1.6;
  padding: 20px 10px ;
  text-align: justify;
}

.back-button {
  margin-left: 10px;
  margin-top: 30px;
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center; /* Center the content */
  background-color: #fd662f;
  width: 40px; /* Equal width */
  height: 40px; /* Equal height */
  border-radius: 50%; /* Makes it a perfect circle */
  margin-bottom: 20px; /* Spacing below the back button */
}

.header-image {
  width: 100%;
  max-height: 300px;
  object-fit: contain;
  margin-bottom: -40px;
  margin-top: 20px;
}
  /* Add styles for phone screen size here */
}
</style>
