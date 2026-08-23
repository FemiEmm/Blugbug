import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from './components/LocalLogin.vue';
import HomePage from './components/LocalHome.vue';
import ChattersPage from './components/LocalMyPosts.vue';
import PublicProfile from './components/LocalPublicProfile.vue';
import ProfileSettings from './components/LocalProfileSettings.vue';
import NotFound from './components/NotFound.vue';
import TermsAndConditions from './components/features/TermsAndConditions.vue';
import BlugReader from './components/LocalReader.vue';
import CreateBlogPostPage from './components/LocalCompose.vue';
import ConnectionsPage from './components/LocalConnections.vue';
import EditPostPage from './components/LocalEditPost.vue';
import AdminManager from './components/LocalAdmin.vue';
import NotificationHistory from './components/LocalNotificationHistory.vue';
import LocalSupport from './components/LocalSupport.vue';
import AccountRecovery from './components/AccountRecovery.vue';
import AccountRecoveryComplete from './components/AccountRecoveryComplete.vue';
import { authStore } from './stores/auth';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/recover-account', component: AccountRecovery },
  { path: '/recover-account/complete', component: AccountRecoveryComplete },
  { path: '/signup', component: () => import('./components/LocalSignup.vue') },
  { path: '/blugpage', redirect: '/blugbugs' },
  { path: '/myblug', component: ChattersPage },
  { path: '/home', name: 'Home', component: HomePage },
  { path: '/explore', redirect: '/blugbugs' },
  { path: '/blugbugs', name: 'Blugbugs', component: HomePage },
  { path: '/logout', redirect: '/login' },
  { path: '/settings', component: ProfileSettings },
  { path: '/user/:userId', name: 'PublicProfile', component: PublicProfile },
  { path: '/terms-and-conditions', component: TermsAndConditions },
  { path: '/read', name: 'BlugReader', component: BlugReader },
  { path: '/blug/:blogId', name: 'SharedBlug', component: BlugReader },
  { path: '/create-blog', name: 'CreateBlogPostPage', component: CreateBlogPostPage },
  { path: '/connections', name: 'ConnectionsPage', component: ConnectionsPage },
  { path: '/edit/:blogId', name: 'EditPostPage', component: EditPostPage },
  { path: '/admin-manager', name: 'AdminManager', component: AdminManager },
  { path: '/notifications', name: 'NotificationHistory', component: NotificationHistory },
  { path: '/support', name: 'Support', component: LocalSupport },
  { path: '/:catchAll(.*)', name: 'NotFound', component: NotFound }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

const publicPaths = new Set(['/login', '/recover-account', '/recover-account/complete', '/terms-and-conditions']);

router.beforeEach(async (to) => {
  const user = await authStore.restore();
  const isPublic = publicPaths.has(to.path) || to.path === '/signup' || to.path === '/blugbugs' || to.path.startsWith('/blug/') || to.path.startsWith('/user/');
  if (!isPublic && !user) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }
  if (to.path === '/login' && user) return '/home';
  if (to.path === '/admin-manager' && user?.role !== 'admin') return '/home';
  return true;
});

export default router;
