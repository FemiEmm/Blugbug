<template>
  <div class="settings-page">
    <NavBar />
    <PageColumns><form class="settings-card surface" @submit.prevent="save">
      <span class="eyebrow">Your identity</span>
      <h1>Profile settings</h1>
      <p class="intro">Keep your public byline personal. Your portrait and header can be changed directly from your profile.</p>
      <aside v-if="pending" class="pending" role="status"><b>Pending approval</b><span>You can use Blugbug normally, but your name, username, profile picture, header, about me and email cannot be changed until an admin approves this recovery.</span></aside>
      <fieldset class="profile-fields" :disabled="pending"><label>Full name<input v-model="form.full_name" required /></label>
      <label>Chatter name<input v-model="form.chatter_name" required /></label>
      <label>About me<textarea v-model="form.about_me" maxlength="200" /></label></fieldset>
      <fieldset class="appearance"><legend>Appearance</legend><p>Choose the colour mode used on this device.</p><div><button type="button" :class="{active:themeMode==='light'}" :aria-pressed="themeMode==='light'" @click="applyTheme('light')"><span aria-hidden="true">☀</span><b>Light</b><small>Warm cream</small></button><button type="button" :class="{active:themeMode==='dark'}" :aria-pressed="themeMode==='dark'" @click="applyTheme('dark')"><span aria-hidden="true">◐</span><b>Dark</b><small>Deep charcoal</small></button></div></fieldset>
      <p v-if="message" :class="{ error: hasError }">{{ message }}</p>
      <button class="primary-button" :disabled="saving||pending">{{ pending ? 'Pending admin approval' : saving ? 'Saving…' : 'Save profile' }}</button>
    </form></PageColumns>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import NavBar from './NavBar.vue';
import PageColumns from './PageColumns.vue';
import { getUser, updateUser } from '../api/users';
import { authStore } from '../stores/auth';
import { applyTheme, themeMode } from '../stores/theme';

const form = reactive({ full_name: '', chatter_name: '', about_me: '' });
const saving = ref(false);
const message = ref('');
const hasError = ref(false);
const pending = ref(false);

onMounted(async () => {
  const id = authStore.user.value?.id;
  if (!id) return;
  const { user } = await getUser(id);
  form.full_name = user.full_name;
  form.chatter_name = user.chatter_name;
  form.about_me = user.about_me;
  pending.value = user.recovery_status === 'pending';
});

const save = async () => {
  if (pending.value) return;
  const id = authStore.user.value?.id;
  if (!id) return;
  saving.value = true;
  message.value = '';
  try {
    const { user } = await updateUser(id, form);
    localStorage.setItem('currentUser', JSON.stringify(user));
    message.value = 'Profile saved.';
    hasError.value = false;
  } catch (error) {
    message.value = error instanceof Error ? error.message : 'Could not save profile.';
    hasError.value = true;
  } finally { saving.value = false; }
};
</script>

<style scoped>
.settings-page { min-height: 100vh; padding: 112px 0 80px; }
.settings-card { width: 100%; margin: 0; padding: clamp(28px, 5vw, 56px); }
h1 { margin: 10px 0 8px; color: var(--ink); font-family: Georgia, serif; font-size: clamp(2.2rem, 6vw, 4rem); letter-spacing: -.055em; }
.intro { max-width: 520px; margin: 0 0 30px; color: var(--muted); line-height: 1.7; }
label { display: grid; gap: 8px; margin: 18px 0; color: var(--ink); font-size: .82rem; font-weight: 800; letter-spacing: .04em; }
input, textarea { padding: 14px 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--input); color: var(--text); font: inherit; }
input:focus, textarea:focus { border-color: var(--orange); outline: 3px solid color-mix(in srgb,var(--orange) 24%,transparent); }
textarea { min-height: 120px; resize: vertical; }
.error { color: var(--orange); }
.profile-fields{margin:0;padding:0;border:0}.profile-fields:disabled{opacity:.58}.pending{display:grid;gap:5px;margin:22px 0;padding:16px;border:1px solid var(--orange);border-radius:14px;background:color-mix(in srgb,var(--orange) 8%,var(--panel));color:var(--ink)}.pending span{color:var(--muted);line-height:1.55}
.appearance{margin:28px 0;padding:20px 0;border:0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.appearance legend{padding:0;font-weight:900}.appearance>p{margin:6px 0 14px;color:var(--muted);font-size:.8rem}.appearance>div{display:grid;grid-template-columns:1fr 1fr;gap:10px}.appearance button{display:grid;grid-template-columns:30px 1fr;gap:2px 8px;padding:13px;border:1px solid var(--line);border-radius:12px;background:var(--panel-2);color:var(--cream);text-align:left}.appearance button>span{grid-row:1/3;font-size:1.25rem}.appearance button small{color:var(--muted)}.appearance button.active{border:2px solid var(--orange);background:var(--panel)}
</style>
