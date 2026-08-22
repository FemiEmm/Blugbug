import { computed, ref } from 'vue';
import * as authApi from '../api/auth';
import type { LocalUser } from '../api/types';

const user = ref<LocalUser | null>(null);
let restorePromise: Promise<LocalUser | null> | null = null;

const saveUser = (nextUser: LocalUser | null) => {
  user.value = nextUser;
  if (nextUser) localStorage.setItem('currentUser', JSON.stringify(nextUser));
  else localStorage.removeItem('currentUser');
};

export const authStore = {
  user,
  isAuthenticated: computed(() => Boolean(user.value)),
  async login(username: string, password: string) {
    const result = await authApi.login(username, password);
    saveUser(result.user);
    return result.user;
  },
  async loginWithSupabase(_accessToken?: string) {
    const result = await authApi.loginWithSupabase();
    saveUser(result.user);
    return result.user;
  },
  async restore() {
    if (user.value) return user.value;
    restorePromise ??= authApi.getSession()
      .then(({ user: sessionUser }) => (saveUser(sessionUser), sessionUser))
      .catch(() => (saveUser(null), null))
      .finally(() => { restorePromise = null; });
    return restorePromise;
  },
  async refresh() {
    const { user: sessionUser } = await authApi.getSession();
    saveUser(sessionUser);
    return sessionUser;
  },
  async logout() {
    try { await authApi.logout(); } finally { saveUser(null); }
  },
};
