<template>
  <div class="create-blog-post-page">
    <NavBar />
    <div class="content-container">
      <input v-model="title" placeholder="Enter the title" class="title-input" />
      <input type="file" @change="handleImageUpload" accept="image/jpeg,image/png,image/webp,image/gif" class="image-input" />
      <img :src="bannerImageUrl || placeholderImageUrl" alt="Banner Preview" class="banner-preview" />
      <TiptapEditor ref="tiptapEditor" :initialContent="''" @updateContent="updateContent" />
      <div class="editor-actions">
        <div class="category-selection">
          <select v-model="selectedCategory">
            <option value="" disabled>Select a category</option>
            <option v-for="category in categories" :key="category">{{ category }}</option>
          </select>
        </div>
        <button @click="publishContent">Publish</button>
        <button @click="cancelCreation">Cancel</button>
      </div>
      <!-- Error messages -->
      <div v-if="showTitleError || showContentError || showCategoryError || showImageError" class="error-message">
        <div v-if="showTitleError">Title is required</div>
        <div v-if="showContentError">Content is required</div>
        <div v-if="showCategoryError">Category is required</div>
        <div v-if="showImageError">{{ imageErrorMessage }}</div> <!-- Updated error message display -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TiptapEditor from '../LocalEditor.vue';
import NavBar from '../NavBar.vue';
import { createPost } from '../../api/posts';
import { authStore } from '../../stores/auth';
import { uploadImage } from '../../api/uploads';

export default defineComponent({
  name: 'CreateBlogPostPage',
  components: {
    NavBar,
    TiptapEditor,
  },
  setup() {
    const router = useRouter();
    const user = ref<any>(null);
    const title = ref<string>('');
    const content = ref<string>('');
    const selectedCategory = ref<string>('');
    const bannerImageUrl = ref<string>(''); // Reactive property for banner image URL
    const placeholderImageUrl = ref<string>('/blug_default.png'); // Placeholder image URL
    const showTitleError = ref<boolean>(false);
    const showContentError = ref<boolean>(false);
    const showCategoryError = ref<boolean>(false);
    const showImageError = ref<boolean>(false);
    const imageErrorMessage = ref<string>(''); // Error message for image validation
    const timestamp = ref<string>('');
    const imageFile = ref<File | null>(null); // Added to store the uploaded image file
    const webpImageFile = ref<File | null>(null); // To store the converted WebP image
    const categories = ref<string[]>([
      "Health", "Fitness", "Nutrition", "MentalHealth", "Meditation", "Skincare", "Fashion",
      "Travel", "SoloTravel", "BudgetTravel", "LuxuryTravel", "Nomad", "HomeDecor", "DIY",
      "Gardening", "Parenting", "Pregnancy", "Toddler", "Education", "Homeschooling", "Student",
      "Career", "Resume", "Interview", "Finance", "Investing", "Budgeting", "SideHustles",
      "Entrepreneurship", "Marketing", "SocialMedia", "Tech", "Software", "Coding", "WebDesign",
      "Photography", "Art", "Music", "Film", "Books", "Literature", "History", "Philosophy",
      "Religion", "Culture", "Environment", "Climate", "Wildlife", "Adventure", "Sports"
    ]);

    onMounted(() => {
      fetchUserInfo();
    });

    const fetchUserInfo = async () => {
      user.value = authStore.user.value;
    };

    const updateContent = (updatedContent: string) => {
      content.value = updatedContent;
      timestamp.value = new Date().toISOString();
    };

    const handleImageUpload = async (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];

        // Check the file type
        // if (file.type !== 'image/jpeg') {
        //   showImageError.value = true;
        //   imageErrorMessage.value = 'Only JPG images are allowed.';
        //   return;
        // }

        // Check the file size (limit: 2MB)
        const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSizeInBytes) {
          showImageError.value = true;
          imageErrorMessage.value = 'Image size must be less than 2MB.';
          return;
        }

        showImageError.value = false; // Reset error state if validations pass
        imageFile.value = file; // Store the file for later use
        bannerImageUrl.value = URL.createObjectURL(file); // Set the preview URL

        // Convert image to WebP
        const webpImage = await convertImageToWebP(file);
        if (webpImage) {
          webpImageFile.value = webpImage; // Store the WebP image file
        }
      }
    };

    // Function to convert an image file to WebP format
    const convertImageToWebP = (file: File): Promise<File | null> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob((blob) => {
                if (blob) {
                  const webpFile = new File([blob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' });
                  resolve(webpFile);
                } else {
                  resolve(null);
                }
              }, 'image/webp', 0.8); // Adjust quality as needed
            }
          };
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
      });
    };

    const publishContent = async () => {
      showTitleError.value = !title.value.trim();
      showContentError.value = !content.value.trim();
      showCategoryError.value = !selectedCategory.value;
      showImageError.value = false;

      if (showTitleError.value || showContentError.value || showCategoryError.value || showImageError.value) {
        return;
      }

      try {
        const { post } = await createPost({ title: title.value, content: content.value, categories: selectedCategory.value });
        if (imageFile.value) await uploadImage(imageFile.value, 'header', post.id);
        await router.push('/home');
      } catch (error) {
        console.error('Error publishing blog post:', error);
      }
    };

    const cancelCreation = () => {
      router.push('/home');
    };

    return {
      title,
      updateContent,
      publishContent,
      categories,
      selectedCategory,
      showTitleError,
      showContentError,
      showCategoryError,
      showImageError,
      imageErrorMessage,
      cancelCreation,
      handleImageUpload, // Return the image upload function
      bannerImageUrl, // Return the banner image URL for preview
      placeholderImageUrl, // Return the placeholder image URL
    };
  },
});
</script>

<style scoped>
.create-blog-post-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #1e1e1e;
  margin-top: 70px;
}

.content-container {
  background-color: #333;
  color: white;
  padding: 20px;
  border-radius: 10px;
  width: 100%;
  text-align: center;
  height: fit-content;
}

.title-input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.image-input {
  margin-bottom: 10px;
}

.banner-preview {
  width: 100%;
  height: 200px;
  object-fit: cover; /* Ensure the image covers the specified dimensions */
  margin-bottom: 10px; /* Space between image and editor */
}

.category-selection select {
  padding: 10px;
  font-size: 16px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.category-selection select:focus {
  outline: none;
  box-shadow: 0 0 5px #fd662f;
  border-color: #fd662f;
}

.category-selection option {
  padding: 10px;
  font-size: 16px;
  background-color: #333;
  color: white;
}

.error-message {
  color: red;
  margin-top: 5px;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

button {
  padding: 10px 20px;
  background-color: #f53;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #e04a2e;
}

.date-meta {
  color: #e04a2e;
}

/* CSS for iPad screen size */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

/* CSS for phone screen size */
@media screen and (max-width: 767px) {
  .create-blog-post-page {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    background-color: #1e1e1e;
    margin-top: 120px;
  }

  .content-container {
    background-color: #333;
    color: white;
    padding: 20px;
    border-radius: 10px;
    width: 100%;
    text-align: center;
    height: fit-content;
  }

  .category-selection select {
    width: 100%;
    padding: 10px;
    font-size: 16px;
    border-radius: 4px;
    border: 1px solid #ccc;
  }

  .category-selection option {
    padding: 10px;
    font-size: 12px;
    background-color: #333;
    color: white;
    width: 100%;
    height: fit-content;
  }

  .banner-preview {
  width: 100%;
  height: 100px;
  object-fit: cover; /* Ensure the image covers the specified dimensions */
  margin-bottom: 10px; /* Space between image and editor */
}
}
</style>
