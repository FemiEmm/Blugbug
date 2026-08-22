<template>
  <main class="recovery-page">
    <section class="recovery-card">
      <router-link class="brand" to="/login"><img src="/brand_logo.svg" alt="Blugbug" /></router-link>
      <span class="eyebrow">Account recovery</span>
      <h1>Find your old Blugbug account</h1>
      <p>Enter the email used on the original Blugbug. We will email a secure sign-in link if the account can be recovered.</p>
      <form @submit.prevent="sendLink">
        <label for="recovery-email">Email address</label>
        <input id="recovery-email" v-model.trim="email" type="email" autocomplete="email" required placeholder="you@example.com" />
        <p v-if="message" class="message" role="status">{{ message }}</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button :disabled="busy">{{ busy ? 'Sending…' : 'Email recovery link' }}</button>
      </form>
      <small>For security, the message is intentionally the same whether or not an email is registered.</small>
      <router-link class="back" to="/login">← Back to login</router-link>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { supabase } from '../lib/supabase';
const email=ref(''),busy=ref(false),message=ref(''),error=ref('');
const sendLink=async()=>{busy.value=true;message.value='';error.value='';try{const{error:sendError}=await supabase.auth.signInWithOtp({email:email.value,options:{shouldCreateUser:true,emailRedirectTo:`${window.location.origin}/recover-account/complete`}});if(sendError)throw sendError;message.value='Check your email for a secure recovery link. It may take a few minutes.'}catch(caught){error.value=caught instanceof Error?caught.message:'Could not send the recovery email.'}finally{busy.value=false}};
</script>

<style scoped>
.recovery-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--page)}.recovery-card{width:min(480px,100%);padding:clamp(26px,6vw,50px);border:1px solid var(--line);border-radius:24px;background:var(--panel);box-shadow:0 22px 60px rgba(45,30,18,.12)}.brand img{width:145px;margin-bottom:38px}.eyebrow{color:var(--orange);font-weight:900;letter-spacing:.14em;text-transform:uppercase}h1{margin:10px 0 14px;color:var(--text);font:700 clamp(2rem,7vw,3.2rem)/.98 Georgia,serif}p{color:var(--muted);line-height:1.65}form{display:grid;gap:10px;margin-top:25px}label{color:var(--text);font-weight:800}input{padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--input);color:var(--text);font:inherit}input:focus{outline:3px solid color-mix(in srgb,var(--orange) 22%,transparent);border-color:var(--orange)}button{margin-top:7px;padding:14px;border:0;border-radius:12px;background:var(--orange);color:white;font-weight:900;cursor:pointer}button:disabled{opacity:.6}.message{color:#247a45}.error{color:var(--orange)}small{display:block;margin-top:18px;color:var(--muted);line-height:1.5}.back{display:inline-block;margin-top:24px;color:var(--text);font-weight:800}
</style>
