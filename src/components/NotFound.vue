<template>
  <div class="not-found">
    <Navbar />
    <div class="content">
      <h1>404 - Page Not Found</h1>
      <p>This is probably not our fault, but let's help you out.</p>
      <div class="button-container">
        <button @click="goHome">Go to Homepage</button>
        <button @click="goToLogin">Go to Login Page</button>
        <button @click="goToSignup">Sign Up</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from './NavBar.vue';

export default defineComponent({
  name: 'NotFound',
  components: {
    Navbar,
  },
  setup() {
    const router = useRouter();

    const goHome = () => {
      router.push('/home');
    };

    const goToLogin = () => {
      router.push('/login');
    };

    const goToSignup = () => {
      router.push('/signup');
    };

    return {
      goHome,
      goToLogin,
      goToSignup,
    };
  },
});
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: var(--page);
  color: var(--text);
  text-align: center;
}

.content {
  max-width: 400px;
  padding: 20px;
  background-color: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

h1 {
  font-size: 32px;
  margin-bottom: 20px;
}

p {
  font-size: 16px;
  margin-bottom: 40px;
  color: var(--muted);
}

.button-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: var(--orange);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: var(--orange-2);
}
</style>
