<template>
  <main class="recovery-page"><section class="recovery-card">
    <router-link class="brand" to="/login"><img src="/brand_logo.svg" alt="Blugbug" /></router-link>
    <span class="eyebrow">Account recovery</span><h1>Find your old Blugbug account</h1>
    <p>Enter the email used on the original Blugbug, then choose how to restore it.</p>
    <form v-if="!lookedUp" @submit.prevent="findAccount">
      <label for="recovery-email">Email address</label><input id="recovery-email" v-model.trim="email" type="email" autocomplete="email" required placeholder="you@example.com" />
      <p v-if="error" class="error" role="alert">{{error}}</p><button :disabled="busy">{{busy?'Checking…':'Continue'}}</button>
    </form>
    <form v-else @submit.prevent="recover">
      <button class="change-email" type="button" @click="reset">← {{email}}</button>
      <fieldset><legend>Choose a recovery option</legend>
        <label class="method"><input v-model="method" type="radio" value="email"><span><b>Email only</b><small>Enter immediately. Profile Settings remains pending until an admin approves the recovery.</small></span></label>
        <label v-if="secretQuestion" class="method"><input v-model="method" type="radio" value="secret"><span><b>Answer secret question</b><small>A correct old answer restores the account as approved.</small></span></label>
      </fieldset>
      <label v-if="method==='secret'" for="secret-answer">{{secretQuestion}}</label><input v-if="method==='secret'" id="secret-answer" v-model="secretAnswer" required autocomplete="off">
      <label for="new-password">New password</label><input id="new-password" v-model="password" type="password" minlength="10" autocomplete="new-password" required>
      <label for="confirm-password">Confirm password</label><input id="confirm-password" v-model="confirmation" type="password" minlength="10" autocomplete="new-password" required>
      <p v-if="message" class="message" role="status">{{message}}</p><p v-if="error" class="error" role="alert">{{error}}</p>
      <button :disabled="busy">{{busy?'Restoring…':'Restore my account'}}</button>
    </form>
    <router-link class="back" to="/login">← Back to login</router-link>
  </section></main>
</template>
<script setup lang="ts">
import{ref}from'vue';import{useRouter}from'vue-router';import{supabase}from'../lib/supabase';import{authStore}from'../stores/auth';
const router=useRouter(),email=ref(''),busy=ref(false),message=ref(''),error=ref(''),lookedUp=ref(false),secretQuestion=ref(''),method=ref<'email'|'secret'>('email'),secretAnswer=ref(''),password=ref(''),confirmation=ref('');
const callRecovery=async(body:Record<string,unknown>)=>{const response=await fetch('/.netlify/functions/legacy-recovery',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Account recovery failed.');return data};
const findAccount=async()=>{busy.value=true;error.value='';try{const data=await callRecovery({action:'lookup',email:email.value});secretQuestion.value=data.secretQuestion||'';lookedUp.value=true}catch(caught){error.value=caught instanceof Error?caught.message:'Could not find this account.'}finally{busy.value=false}};
const reset=()=>{lookedUp.value=false;secretQuestion.value='';secretAnswer.value='';password.value='';confirmation.value='';error.value='';message.value='';method.value='email'};
const recover=async()=>{if(password.value!==confirmation.value){error.value='The passwords do not match.';return}busy.value=true;error.value='';try{const data=await callRecovery({email:email.value,password:password.value,method:method.value,secretAnswer:secretAnswer.value});const{error:loginError}=await supabase.auth.signInWithPassword({email:email.value,password:password.value});if(loginError)throw loginError;await authStore.loginWithSupabase();if(data.status==='pending')sessionStorage.setItem('blugbug-recovery-note','Profile Settings is pending admin approval.');await router.push('/home')}catch(caught){error.value=caught instanceof Error?caught.message:'Could not recover this account.'}finally{busy.value=false}};
</script>
<style scoped>
.recovery-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:var(--page)}.recovery-card{width:min(500px,100%);padding:clamp(26px,6vw,50px);border:1px solid var(--line);border-radius:24px;background:var(--panel);box-shadow:0 22px 60px rgba(45,30,18,.12)}.brand img{width:145px;margin-bottom:38px}.eyebrow{color:var(--orange);font-weight:900;letter-spacing:.14em;text-transform:uppercase}h1{margin:10px 0 14px;color:var(--text);font:700 clamp(2rem,7vw,3.2rem)/.98 Georgia,serif}p{color:var(--muted);line-height:1.65}form{display:grid;gap:10px;margin-top:25px}label,legend{color:var(--text);font-weight:800}input{padding:14px 16px;border:1px solid var(--line);border-radius:12px;background:var(--input);color:var(--text);font:inherit}input:focus{outline:3px solid color-mix(in srgb,var(--orange) 22%,transparent);border-color:var(--orange)}button{margin-top:7px;padding:14px;border:0;border-radius:12px;background:var(--orange);color:white;font-weight:900;cursor:pointer}button:disabled{opacity:.6}.message{color:#247a45}.error{color:var(--orange)}small{display:block;color:var(--muted);line-height:1.5}.back{display:inline-block;margin-top:24px;color:var(--text);font-weight:800}fieldset{display:grid;gap:10px;padding:0;border:0}.method{display:flex;gap:10px;padding:13px;border:1px solid var(--line);border-radius:14px}.method input{width:18px}.method small{margin-top:4px;font-weight:400}.change-email{justify-self:start;padding:0;background:none;color:var(--orange)}
</style>
