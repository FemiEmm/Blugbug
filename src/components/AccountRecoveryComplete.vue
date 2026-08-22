<template>
  <main class="recovery-page"><section class="recovery-card">
    <img class="brand" src="/brand_logo.svg" alt="Blugbug" />
    <template v-if="checking"><h1>Verifying your account…</h1><p>Please keep this page open.</p></template>
    <template v-else-if="claimError"><h1>We could not restore this account</h1><p class="error" role="alert">{{ claimError }}</p><router-link to="/recover-account">Try another email</router-link></template>
    <form v-else @submit.prevent="finish">
      <span class="eyebrow">Account found</span><h1>Create a new password</h1><p>Your old password was not copied. Choose a new password to protect the recovered account.</p>
      <label for="new-password">New password</label><input id="new-password" v-model="password" type="password" minlength="10" autocomplete="new-password" required />
      <label for="confirm-password">Confirm password</label><input id="confirm-password" v-model="confirmation" type="password" minlength="10" autocomplete="new-password" required />
      <p v-if="error" class="error" role="alert">{{ error }}</p><button :disabled="busy">{{busy?'Restoring…':'Restore my account'}}</button>
    </form>
  </section></main>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';import{useRouter}from'vue-router';import{authStore}from'../stores/auth';import{supabase}from'../lib/supabase';
const router=useRouter(),checking=ref(true),claimError=ref(''),password=ref(''),confirmation=ref(''),error=ref(''),busy=ref(false);
onMounted(async()=>{try{const{data:{session}}=await supabase.auth.getSession();if(!session)throw new Error('The recovery link is invalid or has expired. Request a new one.');const{error:claimFailure}=await supabase.rpc('blugbug_claim_legacy_account');if(claimFailure)throw claimFailure}catch(caught){claimError.value=caught instanceof Error?caught.message:'Account recovery failed.'}finally{checking.value=false}});
const finish=async()=>{if(password.value!==confirmation.value){error.value='The passwords do not match.';return}if(password.value.length<10){error.value='Use at least 10 characters.';return}busy.value=true;error.value='';try{const{error:updateError}=await supabase.auth.updateUser({password:password.value});if(updateError)throw updateError;await authStore.loginWithSupabase();await router.push('/home')}catch(caught){error.value=caught instanceof Error?caught.message:'Could not finish restoring the account.'}finally{busy.value=false}};
</script>

<style scoped>
.recovery-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--page)}.recovery-card{width:min(480px,100%);padding:clamp(26px,6vw,50px);border:1px solid var(--line);border-radius:24px;background:var(--panel)}.brand{width:145px;margin-bottom:38px}.eyebrow{color:var(--orange);font-weight:900;letter-spacing:.14em;text-transform:uppercase}h1{margin:10px 0 14px;color:var(--text);font:700 clamp(2rem,7vw,3.1rem)/1 Georgia,serif}p{color:var(--muted);line-height:1.6}form{display:grid;gap:10px}label{margin-top:8px;color:var(--text);font-weight:800}input{padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--input);color:var(--text)}button{margin-top:10px;padding:14px;border:0;border-radius:12px;background:var(--orange);color:white;font-weight:900}.error{color:var(--orange)}a{color:var(--orange);font-weight:800}
</style>
