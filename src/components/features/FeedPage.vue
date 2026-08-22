<template>
  <div class="feed-contain">
    <div class="feedheader">
      <!-- <h3>Blug</h3> -->
    </div>
    <ul>
      <li v-if="feedPosts.length === 0" class="no-following-message">
        No local posts yet.
      </li>
      <li v-for="post in feedPosts" :key="post.id">
        <div @click="toggleContent(post.id)" class="post-title">{{ post.title }}</div>
        <div class="post-meta">by {{ post.userFullName }} on {{ formatDateTime(post.date) }}</div>
        <div class="post-actions">
          <span class="action-item">Likes: {{ post.likes }}</span>
          <i 
            class="fas fa-bookmark action-item" 
            :class="{ 'bookmarked': isBookmarked(post) }"
            @click.stop="bookmarkPost(post)"
          ></i>
          <button @click="readPost(post)" class="action-item">Read</button>
        </div>
        <div v-if="expandedPost === post.id" class="post-content" v-html="post.content"></div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { listPosts } from '../../api/posts';

interface Post {
  id: string;
  title: string;
  content: string;
  likes: number;
  user: string;
  userFullName: string;
  date: string;
  bookmarked_by: string[];
  blog_id: string;
}

export default defineComponent({
  name: 'FeedPage',
  setup() {
    const feedPosts = ref<Post[]>([]);
    const expandedPost = ref<string | null>(null);
    const router = useRouter();

    const loadFeedPosts = async () => {
      try {
        const { posts } = await listPosts();
        feedPosts.value = posts.map((post) => ({
          id: post.id, title: post.title, content: post.content, likes: 0,
          user: post.user_id, userFullName: post.full_name || post.chatter_name || 'Local user',
          date: post.created_at, bookmarked_by: [], blog_id: post.id,
        }));
      } catch (error) { console.error(error); }
    };

    const formatDateTime = (dateTime: string) => {
      const date = new Date(dateTime);
      const formattedTime = date.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
      const formattedDate = date.toLocaleDateString();
      return `${formattedTime} on ${formattedDate}`;
    };

    const readPost = (post: Post) => {
      // Navigate to BlugReader with blog_id and title as query parameters
      router.push({ 
        name: 'BlugReader', 
        query: { postId: post.id.toString(), blogId: post.blog_id, postTitle: post.title }
      });
    };

    const bookmarkPost = async (post: Post) => {
      return post;
    };

    const isBookmarked = (post: Post) => {
      return false;
    };

    const toggleContent = (postId: string) => {
      expandedPost.value = expandedPost.value === postId ? null : postId;
    };

    onMounted(() => {
      loadFeedPosts();
    });

    return {
      feedPosts,
      expandedPost,
      readPost,
      bookmarkPost,
      toggleContent,
      formatDateTime,
      isBookmarked,
    };
  },
});
</script>

<style scoped>
.feed-container {
  margin: 20px 0;
  border: solid 5px #006aff;
  padding: 5px;
}

ul {
  list-style-type: none;
  color: #cebfad;
  padding-left: 30px;
  padding-right: 10px;
  width: 100%;
}

li {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  border-bottom: 1px solid #ccc;
}

.post-item {
  border: none;
}

.post-title {
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.post-meta {
  font-size: 14px;
  color: gray;
  margin-top: 10px
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.post-actions .action-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  background: none;
  border: none;
  color: #f53;
  cursor: pointer;
  padding: 5px;
}

.post-actions .action-item:hover {
  color: #fd662f;
}

.post-actions .fa-bookmark.bookmarked {
  color: yellow; /* Set bookmark color to yellow when active */
}

.post-content {
  margin-top: 10px;
}

.no-following-message {
  font-size: 18px;
  color: #cebfad;
  text-align: center;
  margin-top: 20px;
}

@media (max-width: 780px){
  ul {
  
  padding-left: 0px;
  padding-right: 0px;
}
}
</style>
