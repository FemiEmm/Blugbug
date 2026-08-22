import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/reset.css';
import './assets/global.css';
import './assets/app.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { initializeTheme } from './stores/theme';

import { 
  faHouse, 
  faComments, 
  faGlobe, 
  faSignOutAlt, 
  faTrashAlt, 
  faCog, 
  faHeart, 
  faBookmark, 
  faCircleCheck, 
  faCircleXmark,
  faBold, 
  faItalic, 
  faAlignLeft, 
  faAlignCenter, 
  faAlignRight, 
  faImage, 
  faLink, 
  faBookOpenReader, 
  faCircleChevronDown, 
  faCompressAlt, 
  faExpandAlt, 
  faExpand, 
  faToggleOn, 
  faToggleOff,
  faCircleRight, 
  faCircleLeft,
  faTrash,
  faBars, // Import faBars
  faToolbox,
  faArrowsRotate,
  faPlus,
  faUserMinus,
  faHeadset,
  faMagnifyingGlass,
  faPenClip,
  faPersonWalking,
  faPersonCircleMinus,
  faPersonCirclePlus,
  faClockRotateLeft,
  faShareFromSquare,
  faBell
} from '@fortawesome/free-solid-svg-icons';

library.add(
  faHouse, 
  faComments, 
  faGlobe, 
  faSignOutAlt, 
  faTrashAlt, 
  faCog, 
  faHeart, 
  faBookmark, 
  faCircleCheck, 
  faCircleXmark,
  faBold,
  faItalic,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faImage,
  faLink,
  faBookOpenReader,
  faCircleChevronDown,
  faCompressAlt,
  faExpandAlt,
  faExpand,
  faToggleOn,
  faToggleOff,
  faCircleRight, 
  faCircleLeft,
  faTrash,
  faToolbox,
  faCircleXmark,
  faArrowsRotate,
  faPlus,
  faUserMinus,
  faHeadset,
  faMagnifyingGlass,
  faPenClip,
  faPersonWalking,
  faPersonCircleMinus,
  faPersonCirclePlus,
  faClockRotateLeft,
  faShareFromSquare,
  faBell,
  faBars // Add faBars to library
);

const app = createApp(App);
initializeTheme();

app.component('font-awesome-icon', FontAwesomeIcon);

app.use(router).mount('#app');
