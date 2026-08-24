<template>
  <main>
    <NavBar />
    <section class="studio">
      <header class="studio-head">
        <div>
          <span class="eyebrow">Private workspace</span>
          <h1>Admin Studio</h1>
          <p>Manage Blugbug’s channels, community and activity from one place.</p>
        </div>
        <div class="stats">
          <span
            ><small>Community</small><b>{{ overview.users }}</b> users</span
          ><span
            ><small>Published</small><b>{{ overview.posts }}</b> blugs</span
          ><span
            ><small>Activity</small><b>{{ overview.notifications }}</b> records</span
          >
        </div>
      </header>
      <nav class="tabs" aria-label="Admin sections">
        <button :class="{ active: tab === 'imports' }" @click="tab = 'imports'">
          <span>⇣</span> Import queue <b>{{ activeDrafts.length }}</b></button
        ><button :class="{ active: tab === 'channels' }" @click="tab = 'channels'">
          <span>◉</span> Channels <b>{{ channels.length }}</b></button
        ><button :class="{ active: tab === 'users' }" @click="tab = 'users'">
          <span>♙</span> Users <b>{{ users.length }}</b></button
        ><button :class="{ active: tab === 'notifications' }" @click="tab = 'notifications'">
          <span>◇</span> Notifications <b>{{ notifications.length }}</b>
        </button>
      </nav>
      <section v-if="tab === 'imports'" class="management-panel">
        <header class="section-heading">
          <div>
            <span class="eyebrow">Local publishing desk</span>
            <h2>Import queue</h2>
            <p>Review rewritten stories here. Nothing reaches Supabase until you publish it.</p>
          </div>
          <div class="folder-actions">
            <button class="primary" :disabled="busy" @click="chooseImportFolder">
              Choose package folder
            </button>
            <button v-if="localQueue" class="quiet-action" :disabled="busy" @click="refreshDrafts">
              Scan local drop folder
            </button>
          </div>
        </header>
        <div class="browser-folder-note">
          <b>Works from localhost, www or Netlify</b>
          <p>
            Choose the folder containing your unzipped packages. Blugbug will load them here for
            review. Your browser will ask before allowing folder access.
          </p>
          <p v-if="folderImportErrors.length" class="folder-errors">
            {{ folderImportErrors.join(' ') }}
          </p>
        </div>
        <div v-if="importScan" class="drop-folder">
          <b>Drop-folder workflow</b>
          <p>
            Unzip ChatGPT packages into <code>{{ importScan.inboxDir }}</code
            >. Return here and press “Scan drop folder”.
          </p>
          <details v-if="importScan.errors.length">
            <summary>{{ importScan.errors.length }} package error(s)</summary>
            <p v-for="issue in importScan.errors" :key="issue.package">
              <b>{{ issue.package }}:</b> {{ issue.error }}
            </p>
          </details>
        </div>
        <div class="import-list">
          <article v-for="draft in activeDrafts" :key="draft.id" class="import-card">
            <div class="import-meta">
              <span class="role">{{ draft.status }}</span
              ><a :href="draft.source_url" target="_blank" rel="noopener">Open source ↗</a>
            </div>
            <label
              >Channel<select v-model="draft.channel_id">
                <option
                  v-if="
                    draft.proposed_channel_name &&
                    !channels.some((channel) => channel.id === draft.channel_id)
                  "
                  :value="draft.channel_id"
                >
                  New: {{ draft.proposed_channel_name }} — created when published
                </option>
                <option v-for="channel in channels" :key="channel.id" :value="channel.id">
                  {{ channel.full_name }}
                </option>
              </select>
              <small
                v-if="
                  draft.proposed_channel_name &&
                  !channels.some((channel) => channel.id === draft.channel_id)
                "
                class="proposed-channel"
              >
                Proposed by the package. Select another channel, or keep this to create it when
                publishing.
              </small>
              <button class="new-channel-toggle" type="button" @click="openChannelCreator(draft)">
                + Name and create a new channel
              </button></label
            >
            <div v-if="channelCreators[draft.id]?.open" class="new-channel-form">
              <div class="new-channel-heading">
                <div>
                  <b>Create a channel</b>
                  <p>This channel will be created in Supabase and assigned to this draft.</p>
                </div>
                <button
                  type="button"
                  class="close-channel-form"
                  @click="channelCreators[draft.id].open = false"
                >
                  ×
                </button>
              </div>
              <label
                >Channel name
                <input
                  v-model="channelCreators[draft.id].name"
                  maxlength="100"
                  placeholder="Example: Nigeria Career & AI"
                  @input="suggestChannelHandle(draft.id)"
                />
              </label>
              <label
                >Channel handle
                <div class="channel-handle-input">
                  <span>@</span>
                  <input
                    v-model="channelCreators[draft.id].handle"
                    maxlength="40"
                    placeholder="nigeria.career.ai"
                  />
                </div>
              </label>
              <label
                >About this channel
                <textarea
                  v-model="channelCreators[draft.id].about"
                  rows="3"
                  maxlength="500"
                  placeholder="What will this channel publish?"
                ></textarea>
              </label>
              <div class="new-channel-actions">
                <button
                  type="button"
                  class="quiet-action"
                  @click="channelCreators[draft.id].open = false"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  class="primary"
                  :disabled="busy"
                  @click="createChannelForDraft(draft)"
                >
                  Create and assign channel
                </button>
              </div>
            </div>
            <label>Topic<input v-model="draft.topic" maxlength="80" /></label
            ><label>Title<input v-model="draft.title" maxlength="180" /></label>
            <div class="draft-cover">
              <img v-if="draft.cover_image_url" :src="draft.cover_image_url" alt="Draft cover" />
              <div v-else class="cover-placeholder"><span>▧</span>No cover image</div>
              <div>
                <b>Cover image</b>
                <p>JPG, PNG, WEBP or GIF. It stays local until this Blug is published.</p>
                <label class="file-action"
                  >{{ draft.cover_image_url ? 'Replace cover' : 'Add cover' }}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    @change="setDraftCover(draft, $event)"
                /></label>
                <button
                  v-if="draft.cover_image_url"
                  class="remove-cover"
                  :disabled="busy"
                  @click="removeDraftCover(draft)"
                >
                  Remove
                </button>
              </div>
            </div>
            <label>Blug text<textarea v-model="draft.content" rows="14"></textarea></label>
            <div class="import-actions">
              <button class="danger" :disabled="busy" @click="rejectDraft(draft)">Reject</button
              ><button class="quiet-action" :disabled="busy" @click="saveDraft(draft)">
                Save draft</button
              ><button class="primary" :disabled="busy" @click="publishDraft(draft)">
                Publish to Supabase
              </button>
            </div>
          </article>
        </div>
        <p v-if="!activeDrafts.length" class="empty">The local queue is clear.</p>
      </section>
      <div v-else-if="tab === 'channels'" class="channel-grid">
        <aside class="channel-list">
          <label class="search"
            >⌕<input
              v-model="query"
              aria-label="Search channels"
              placeholder="Search channels" /></label
          ><button
            v-for="channel in filteredChannels"
            :key="channel.id"
            class="channel-row"
            :class="{ selected: selected?.id === channel.id }"
            @click="selectChannel(channel)"
          >
            <img :src="channel.profile_image_url || '/Default_pfp.svg'" alt="" /><span
              ><b>{{ channel.full_name }}</b
              ><small>@{{ channel.chatter_name }} · {{ channel.post_count }} blugs</small></span
            >
          </button>
        </aside>
        <div v-if="selected" class="editor">
          <div class="identity-card">
            <div
              class="cover"
              :style="{
                backgroundImage: `url(${selected.header_image_url || '/Default_Header.svg'})`
              }"
            >
              <label class="image-button"
                >Change header<input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  @change="uploadChannelImage($event, 'header')"
              /></label>
            </div>
            <div class="identity">
              <div class="avatar-wrap">
                <img
                  :src="selected.profile_image_url || '/Default_pfp.svg'"
                  alt="Channel profile"
                /><label class="avatar-button" title="Change profile picture"
                  >+<input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    @change="uploadChannelImage($event, 'profile')"
                /></label>
              </div>
              <div>
                <h2>{{ selected.full_name }}</h2>
                <p>@{{ selected.chatter_name }}</p>
              </div>
              <span class="locked">Channel · no login</span>
            </div>
          </div>
          <form class="panel fields" @submit.prevent="saveChannel">
            <div class="panel-title">
              <div>
                <h3>Channel details</h3>
                <p>Changes appear everywhere this channel is shown.</p>
              </div>
              <button class="primary" :disabled="busy">
                {{ busy ? 'Saving…' : 'Save changes' }}
              </button>
            </div>
            <label>Name<input v-model="channelForm.full_name" maxlength="100" required /></label
            ><label
              >Handle
              <div class="handle">
                <span>@</span
                ><input v-model="channelForm.chatter_name" maxlength="40" required /></div></label
            ><label class="wide"
              >Description<textarea
                v-model="channelForm.about_me"
                maxlength="500"
                rows="3"
              ></textarea
              ><small>{{ channelForm.about_me.length }}/500</small></label
            >
          </form>
          <section class="panel">
            <div class="panel-title">
              <div>
                <h3>Channel blugs</h3>
                <p>Edit existing blugs or add a new one.</p>
              </div>
              <button class="primary" @click="newPost">+ New blug</button>
            </div>
            <form v-if="postEditor" class="post-form" @submit.prevent="savePost">
              <div class="form-heading">
                <b>{{ postEditor.id ? 'Edit blug' : 'New channel blug' }}</b
                ><button type="button" class="quiet" @click="postEditor = null">Close</button>
              </div>
              <label>Title<input v-model="postEditor.title" maxlength="180" required /></label
              ><label
                >Topic<input
                  v-model="postEditor.categories"
                  maxlength="80"
                  placeholder="History, Sports, Culture…" /></label
              ><label
                >Blug text<textarea v-model="postEditor.content" rows="12" required></textarea>
              </label>
              <div class="post-actions">
                <label v-if="postEditor.id" class="upload-cover"
                  >Add / replace cover<input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    @change="uploadPostCover" /></label
                ><span v-else>Save first, then add its cover.</span
                ><button class="primary" :disabled="busy">
                  {{ busy ? 'Saving…' : postEditor.id ? 'Update blug' : 'Publish blug' }}
                </button>
              </div>
            </form>
            <div class="post-list">
              <article v-for="post in selected.posts" :key="post.id">
                <img :src="post.header_image_url || '/Default_Header.svg'" alt="" />
                <div>
                  <span>{{ post.categories || 'Uncategorized' }}</span>
                  <h4>{{ post.title }}</h4>
                  <small>Updated {{ formatDate(post.updated_at) }}</small>
                </div>
                <button @click="editPost(post)">Edit</button>
              </article>
            </div>
          </section>
        </div>
        <div v-else class="empty">No channel found.</div>
      </div>
      <section v-else-if="tab === 'users'" class="management-panel">
        <header class="section-heading">
          <div>
            <span class="eyebrow">Community directory</span>
            <h2>Users</h2>
            <p>Review accounts and approve eligible profile recoveries.</p>
          </div>
          <label class="directory-search"
            >⌕<input v-model="userQuery" aria-label="Search users" placeholder="Search users"
          /></label>
        </header>
        <section v-if="pendingRecoveries.length" class="recovery-card">
          <div>
            <span class="eyebrow">Needs attention</span>
            <h3>Pending recovery approvals</h3>
          </div>
          <article v-for="user in pendingRecoveries" :key="`pending-${user.id}`">
            <img :src="user.profile_image_url || '/Default_pfp.svg'" alt="" /><span
              ><b>{{ user.full_name }}</b
              ><small>@{{ user.chatter_name }} · {{ user.email }}</small></span
            ><button :disabled="busy" @click="approveRecovery(user.id)">Approve</button>
          </article>
        </section>
        <div class="user-grid">
          <article v-for="user in filteredUsers" :key="user.id" class="user-card">
            <img :src="user.profile_image_url || '/Default_pfp.svg'" alt="" />
            <div>
              <h3>{{ user.full_name || user.chatter_name }}</h3>
              <p>@{{ user.chatter_name }}</p>
              <small>{{ user.email || 'No email available' }}</small>
            </div>
            <span class="role">{{ user.role }}</span
            ><button
              v-if="user.id !== me && !user.id.startsWith('channel-')"
              class="danger"
              @click="removeUser(user.id)"
            >
              Delete
            </button>
          </article>
        </div>
        <p v-if="!filteredUsers.length" class="empty">No users match your search.</p>
      </section>
      <section v-else class="management-panel">
        <header class="section-heading">
          <div>
            <span class="eyebrow">Platform activity</span>
            <h2>Notifications</h2>
            <p>Review the activity records generated across Blugbug.</p>
          </div>
        </header>
        <div class="notification-list">
          <article v-for="item in notifications" :key="item.id">
            <span class="notification-icon">{{ notificationIcon(item.type) }}</span>
            <div>
              <b>{{ item.message }}</b
              ><small>{{ item.type.replace('_', ' ') }} · {{ formatDate(item.created_at) }}</small>
            </div>
            <span v-if="!item.read" class="unread-label">Unread</span
            ><button class="danger" @click="removeNotification(item.id)">Delete</button>
          </article>
        </div>
        <p v-if="!notifications.length" class="empty">No notification records.</p>
      </section>
      <p v-if="message" class="toast" role="status">{{ message }}</p>
    </section>
  </main>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import NavBar from './NavBar.vue'
import {
  adminApproveRecovery,
  adminCreateChannel,
  adminCreateChannelPost,
  adminDeleteNotification,
  adminDeleteUser,
  adminUpdateChannel,
  adminUpdateChannelPost,
  getAdminOverview,
  listAdminChannels,
  listAdminNotifications,
  listAdminUsers,
  type AdminChannel
} from '../api/admin'
import {
  listImportDrafts,
  updateImportDraft,
  uploadImportDraftCover,
  type ImportDraft,
  type ImportScan
} from '../api/import-queue'
import { uploadImage } from '../api/uploads'
import { authStore } from '../stores/auth'
import type { LocalPost, LocalUser } from '../api/types'
import type { LocalNotification } from '../api/notifications'
const localQueue = ['localhost', '127.0.0.1'].includes(window.location.hostname)
const overview = reactive({ users: 0, posts: 0, notifications: 0, supportCases: 0 }),
  users = ref<LocalUser[]>([]),
  notifications = ref<LocalNotification[]>([]),
  channels = ref<AdminChannel[]>([]),
  drafts = ref<ImportDraft[]>([]),
  folderDrafts = ref<ImportDraft[]>([]),
  folderImportErrors = ref<string[]>([]),
  importScan = ref<ImportScan | null>(null),
  selected = ref<AdminChannel | null>(null),
  tab = ref<'imports' | 'channels' | 'users' | 'notifications'>(
    localQueue ? 'imports' : 'channels'
  ),
  query = ref(''),
  userQuery = ref(''),
  busy = ref(false),
  message = ref(''),
  me = authStore.user.value?.id
const channelForm = reactive({ full_name: '', chatter_name: '', about_me: '' })
const folderLocations = new Map<string, { parent: any; name: string }>()
const isFolderDraft = (draft: ImportDraft) => draft.id.startsWith('browser-import-')
const escapeImportedText = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character]!
  )
const importedMarkdownToHtml = (markdown: string) =>
  markdown
    .split(/\r?\n\r?\n/)
    .map((block) => {
      const value = block.trim()
      if (!value) return ''
      const heading = value.match(/^(#{1,3})\s+([\s\S]+)$/)
      return heading
        ? `<h${heading[1].length}>${escapeImportedText(heading[2])}</h${heading[1].length}>`
        : `<p>${escapeImportedText(value).replace(/\r?\n/g, '<br>')}</p>`
    })
    .join('')
const sanitizeImportedHtml = (html: string) => {
  const document = new DOMParser().parseFromString(html, 'text/html')
  document
    .querySelectorAll('script,style,iframe,object,embed,form,input,button,img,video,audio')
    .forEach((node) => node.remove())
  document.body.querySelectorAll<HTMLElement>('*').forEach((element) => {
    for (const attribute of [...element.attributes]) {
      if (element.tagName === 'A' && attribute.name === 'href') {
        if (!/^https?:\/\//i.test(attribute.value)) element.removeAttribute(attribute.name)
      } else element.removeAttribute(attribute.name)
    }
  })
  return document.body.innerHTML
}
const readPackageDirectory = async (directory: any, parent: any) => {
  const files = new Map<string, File>()
  for await (const [name, handle] of directory.entries()) {
    if (handle.kind === 'file') files.set(name, await handle.getFile())
  }
  const manifestFile = files.get('manifest.json')
  if (!manifestFile) return false
  try {
    const manifest = JSON.parse(await manifestFile.text())
    const title = String(manifest.title || '').trim()
    const requestedChannel = String(manifest.channel_id || manifest.channel || '').trim()
    if (!title || !requestedChannel) throw new Error('manifest.json needs title and channel.')
    const contentFile = files.get('content.html') || files.get('content.md')
    if (!contentFile) throw new Error('Add content.html or content.md.')
    const rawContent = await contentFile.text()
    const content = sanitizeImportedHtml(
      contentFile.name.endsWith('.md') ? importedMarkdownToHtml(rawContent) : rawContent
    )
    if (!content.replace(/<[^>]+>/g, '').trim()) throw new Error('The Blug text is empty.')
    const matchedChannel = channels.value.find(
      (channel) =>
        channel.id === requestedChannel ||
        channel.full_name.toLowerCase() === requestedChannel.toLowerCase() ||
        channel.chatter_name.toLowerCase() === requestedChannel.replace(/^@/, '').toLowerCase()
    )
    const proposedName = matchedChannel ? '' : requestedChannel
    const proposedHandle = matchedChannel ? '' : toChannelHandle(requestedChannel)
    const sourceUrl = String(manifest.source_url || `folder:${directory.name}:${title}`).trim()
    if ([...drafts.value, ...folderDrafts.value].some((draft) => draft.source_url === sourceUrl))
      return true
    const coverName = String(manifest.cover || '').trim()
    const coverFile = coverName ? files.get(coverName) : undefined
    if (coverName && !coverFile) throw new Error(`Cover file not found: ${coverName}.`)
    if (coverFile && (!coverFile.type.startsWith('image/') || coverFile.size > 5 * 1024 * 1024))
      throw new Error('Cover must be an image no larger than 5 MB.')
    const id = `browser-import-${crypto.randomUUID()}`
    const now = new Date().toISOString()
    folderDrafts.value.push({
      id,
      source_url: sourceUrl,
      source_title: String(manifest.source_title || ''),
      channel_id:
        matchedChannel?.id || `channel-${proposedHandle.replace(/\./g, '-').slice(0, 48)}`,
      proposed_channel_name: proposedName,
      proposed_channel_handle: proposedHandle,
      topic: String(manifest.topic || 'General'),
      title,
      content,
      cover_image_url: coverFile ? URL.createObjectURL(coverFile) : null,
      status: 'ready',
      published_post_id: null,
      created_at: now,
      updated_at: now
    })
    folderLocations.set(id, { parent, name: directory.name })
  } catch (error) {
    folderImportErrors.value.push(
      `${directory.name}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
  return true
}
const scanChosenDirectory = async (directory: any, parent: any = null) => {
  if (await readPackageDirectory(directory, parent)) return
  for await (const [, handle] of directory.entries()) {
    if (handle.kind === 'directory') await scanChosenDirectory(handle, directory)
  }
}
const chooseImportFolder = async () => {
  folderImportErrors.value = []
  const picker = (window as any).showDirectoryPicker
  if (!picker) {
    message.value = 'Folder selection requires a current Chrome or Edge browser.'
    return
  }
  try {
    const directory = await picker({ mode: 'readwrite' })
    await scanChosenDirectory(directory)
    tab.value = 'imports'
    message.value = `${folderDrafts.value.length} folder draft(s) ready for review.`
  } catch (error) {
    if ((error as DOMException).name !== 'AbortError')
      message.value = error instanceof Error ? error.message : 'Could not open that folder.'
  }
}
const channelCreators = reactive<
  Record<string, { open: boolean; name: string; handle: string; about: string }>
>({})
const toChannelHandle = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.|\.$/g, '')
    .slice(0, 40)
const openChannelCreator = (draft: ImportDraft) => {
  const name = draft.proposed_channel_name || ''
  channelCreators[draft.id] = {
    open: true,
    name,
    handle: draft.proposed_channel_handle || toChannelHandle(name),
    about: name ? `Blugs, context and conversations curated by ${name}.` : ''
  }
}
const suggestChannelHandle = (draftId: string) => {
  const form = channelCreators[draftId]
  if (form) form.handle = toChannelHandle(form.name)
}
const postEditor = ref<
  (Pick<LocalPost, 'title' | 'content' | 'categories'> & { id?: string }) | null
>(null)
const filteredChannels = computed(() =>
  channels.value.filter((c) =>
    `${c.full_name} ${c.chatter_name}`.toLowerCase().includes(query.value.toLowerCase())
  )
)
const filteredUsers = computed(() =>
  users.value.filter((user) =>
    `${user.full_name} ${user.chatter_name} ${user.email}`
      .toLowerCase()
      .includes(userQuery.value.toLowerCase())
  )
)
const activeDrafts = computed(() =>
  [...folderDrafts.value, ...drafts.value].filter(
    (draft) => draft.status === 'ready' || draft.status === 'draft'
  )
)
const selectChannel = (c: AdminChannel) => {
  selected.value = c
  Object.assign(channelForm, {
    full_name: c.full_name,
    chatter_name: c.chatter_name,
    about_me: c.about_me || ''
  })
  postEditor.value = null
}
const load = async (keep?: string) => {
  Object.assign(overview, await getAdminOverview())
  channels.value = (await listAdminChannels()).channels
  users.value = (await listAdminUsers()).users
  notifications.value = (await listAdminNotifications()).notifications
  if (localQueue) {
    const result = await listImportDrafts()
    drafts.value = result.drafts
    importScan.value = result.scan
  }
  const channel =
    channels.value.find((c) => c.id === (keep || selected.value?.id)) || channels.value[0]
  if (channel) selectChannel(channel)
}
const refreshDrafts = async () => {
  if (localQueue) {
    const result = await listImportDrafts()
    drafts.value = result.drafts
    importScan.value = result.scan
  }
}
const run = async (fn: () => Promise<void>, ok: string) => {
  busy.value = true
  message.value = ''
  try {
    await fn()
    message.value = ok
    setTimeout(() => (message.value = ''), 2600)
  } catch (e) {
    message.value = e instanceof Error ? e.message : 'Something went wrong.'
  } finally {
    busy.value = false
  }
}
const saveChannel = () =>
  selected.value &&
  run(async () => {
    await adminUpdateChannel(selected.value!.id, { ...channelForm })
    await load(selected.value!.id)
  }, 'Channel updated.')
const saveDraft = (draft: ImportDraft) =>
  run(
    async () => {
      if (!isFolderDraft(draft)) {
        await updateImportDraft(draft.id, {
          channel_id: draft.channel_id,
          topic: draft.topic,
          title: draft.title,
          content: draft.content,
          status: 'ready'
        })
        await refreshDrafts()
      }
    },
    isFolderDraft(draft) ? 'Folder draft changes kept for this review.' : 'Draft saved locally.'
  )
const createChannelForDraft = (draft: ImportDraft) => {
  const form = channelCreators[draft.id]
  if (!form) return
  const name = form.name.trim()
  const handle = toChannelHandle(form.handle)
  if (!name) {
    message.value = 'Enter a channel name.'
    return
  }
  if (handle.length < 2) {
    message.value = 'Enter a channel handle with at least two letters or numbers.'
    return
  }
  const id = `channel-${handle.replace(/\./g, '-').slice(0, 48)}`
  run(async () => {
    await adminCreateChannel({
      id,
      full_name: name,
      chatter_name: handle,
      about_me: form.about.trim()
    })
    if (isFolderDraft(draft)) {
      draft.channel_id = id
      draft.proposed_channel_name = ''
      draft.proposed_channel_handle = ''
    } else
      await updateImportDraft(draft.id, {
        channel_id: id,
        proposed_channel_name: '',
        proposed_channel_handle: ''
      })
    form.open = false
    await load(id)
  }, `${name} created and assigned.`)
}
const rejectDraft = (draft: ImportDraft) =>
  run(async () => {
    if (isFolderDraft(draft)) {
      if (draft.cover_image_url?.startsWith('blob:')) URL.revokeObjectURL(draft.cover_image_url)
      folderDrafts.value = folderDrafts.value.filter((item) => item.id !== draft.id)
      folderLocations.delete(draft.id)
    } else {
      await updateImportDraft(draft.id, { status: 'rejected' })
      await refreshDrafts()
    }
  }, 'Draft rejected.')
const setDraftCover = (draft: ImportDraft, event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  run(async () => {
    if (isFolderDraft(draft)) {
      if (draft.cover_image_url?.startsWith('blob:')) URL.revokeObjectURL(draft.cover_image_url)
      draft.cover_image_url = URL.createObjectURL(file)
    } else {
      await uploadImportDraftCover(draft.id, file)
      await refreshDrafts()
    }
  }, 'Cover added locally.')
}
const removeDraftCover = (draft: ImportDraft) =>
  run(async () => {
    if (isFolderDraft(draft)) {
      if (draft.cover_image_url?.startsWith('blob:')) URL.revokeObjectURL(draft.cover_image_url)
      draft.cover_image_url = null
    } else {
      await updateImportDraft(draft.id, { cover_image_url: null })
      await refreshDrafts()
    }
  }, 'Cover removed.')
const publishDraft = (draft: ImportDraft) =>
  run(async () => {
    let channelId = draft.channel_id
    if (!channels.value.some((channel) => channel.id === channelId)) {
      if (!draft.proposed_channel_name || !draft.proposed_channel_handle)
        throw new Error('Choose an existing channel before publishing.')
      const created = await adminCreateChannel({
        id: channelId,
        full_name: draft.proposed_channel_name,
        chatter_name: draft.proposed_channel_handle
      })
      channelId = created.channel.id
      if (isFolderDraft(draft)) draft.channel_id = channelId
      else await updateImportDraft(draft.id, { channel_id: channelId })
    }
    let postId = draft.published_post_id
    if (!postId) {
      const result = await adminCreateChannelPost(channelId, {
        title: draft.title,
        content: draft.content,
        categories: draft.topic
      })
      postId = result.post.id
      if (isFolderDraft(draft)) draft.published_post_id = postId
      else await updateImportDraft(draft.id, { published_post_id: postId })
    }
    if (draft.cover_image_url) {
      const response = await fetch(draft.cover_image_url)
      if (!response.ok) throw new Error('The local cover image could not be opened.')
      const blob = await response.blob()
      const extension = blob.type.split('/')[1] || 'jpg'
      const cover = new File([blob], `cover.${extension}`, { type: blob.type })
      await uploadImage(cover, 'header', postId, channelId)
    }
    if (isFolderDraft(draft)) {
      const location = folderLocations.get(draft.id)
      if (location?.parent) {
        try {
          await location.parent.removeEntry(location.name, { recursive: true })
        } catch {
          folderImportErrors.value.push(
            `${location.name}: published, but the browser could not remove its folder.`
          )
        }
      }
      if (draft.cover_image_url?.startsWith('blob:')) URL.revokeObjectURL(draft.cover_image_url)
      folderDrafts.value = folderDrafts.value.filter((item) => item.id !== draft.id)
      folderLocations.delete(draft.id)
    } else {
      await updateImportDraft(draft.id, {
        status: 'published',
        published_post_id: postId
      })
      await refreshDrafts()
    }
    await load(channelId)
  }, 'Blug published to Supabase.')
const uploadChannelImage = (e: Event, p: 'header' | 'profile') => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f && selected.value)
    run(
      async () => {
        await uploadImage(f, p, undefined, selected.value!.id)
        await load(selected.value!.id)
      },
      `${p === 'header' ? 'Header' : 'Profile picture'} updated.`
    )
}
const newPost = () => (postEditor.value = { title: '', categories: '', content: '' })
const editPost = (p: LocalPost) =>
  (postEditor.value = {
    id: p.id,
    title: p.title,
    categories: p.categories || '',
    content: p.content
  })
const savePost = () =>
  selected.value &&
  postEditor.value &&
  run(
    async () => {
      const d = postEditor.value!
      if (d.id) await adminUpdateChannelPost(selected.value!.id, d.id, d)
      else {
        const r = await adminCreateChannelPost(selected.value!.id, d)
        postEditor.value = { ...d, id: r.post.id }
      }
      await load(selected.value!.id)
    },
    postEditor.value.id ? 'Blug updated.' : 'Blug published.'
  )
const uploadPostCover = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f && postEditor.value?.id && selected.value)
    run(async () => {
      await uploadImage(f, 'header', postEditor.value!.id)
      await load(selected.value!.id)
    }, 'Cover updated.')
}
const removeUser = async (id: string) => {
  if (confirm('Delete this user?')) {
    await adminDeleteUser(id)
    await load()
  }
}
const removeNotification = async (id: string) => {
  await adminDeleteNotification(id)
  await load()
}
const formatDate = (v: string) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(v))
const notificationIcon = (type: string) =>
  ({ like: '♥', comment: '◯', reply: '↩', quote: '❝', follow: '+', share: '↗', new_post: '▤' })[
    type
  ] || '•'
onMounted(() => load())
const pendingRecoveries = computed(() =>
  users.value.filter((user) => user.recovery_status === 'pending')
)
const approveRecovery = (id: string) =>
  run(async () => {
    await adminApproveRecovery(id)
    await load()
  }, 'Recovery approved.')
</script>
<style scoped>
main {
  min-height: 100vh;
  background: var(--page);
  color: var(--text);
  padding: 112px 24px 90px;
}
.studio {
  width: min(1280px, 100%);
  margin: auto;
}
.studio-head {
  display: flex;
  justify-content: space-between;
  gap: 28px;
  align-items: end;
  margin-bottom: 24px;
  padding: 28px 30px;
  border: 1px solid var(--line);
  border-radius: 24px;
  background: var(--panel);
  box-shadow: var(--shadow);
}
.eyebrow {
  color: var(--orange);
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-size: 0.72rem;
}
h1 {
  font: 700 clamp(2.3rem, 5vw, 4rem) Georgia;
  margin: 7px 0;
}
.studio-head p,
.panel-title p,
.section-heading p {
  color: var(--muted);
  margin: 0;
}
.stats {
  display: flex;
  gap: 10px;
}
.stats span {
  display: grid;
  min-width: 98px;
  padding: 11px 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--soft);
}
.stats small {
  color: var(--muted);
  font-size: 0.62rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.stats b {
  margin-top: 3px;
  font-size: 0.9rem;
}
.locked {
  border: 1px solid var(--line);
  background: var(--soft);
  padding: 10px 14px;
  border-radius: 999px;
}
.tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  padding: 5px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--panel);
}
.tabs button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 11px 16px;
  border: 0;
  border-radius: 11px;
  background: none;
  color: var(--muted);
  font-weight: 800;
  cursor: pointer;
}
.tabs button > b {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--soft);
  font-size: 0.65rem;
}
.tabs button:hover {
  background: var(--soft);
  color: var(--text);
}
.tabs .active {
  background: var(--orange);
  color: #fff;
}
.tabs .active b {
  background: #fff2;
  color: #fff;
}
.channel-grid {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 20px;
}
.channel-list,
.panel,
.identity-card,
.management-panel {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 22px;
}
.channel-list {
  padding: 12px;
  align-self: start;
  position: sticky;
  top: 100px;
}
.search,
.directory-search {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--input);
}
.search {
  margin-bottom: 8px;
}
.search input,
.directory-search input {
  border: 0 !important;
  background: none !important;
  color: var(--text) !important;
  min-width: 0;
  width: 100%;
  margin: 0 !important;
  padding: 0 !important;
  outline: 0;
}
.channel-row {
  display: flex;
  width: 100%;
  gap: 11px;
  align-items: center;
  text-align: left;
  background: none;
  color: var(--text);
  border: 0;
  padding: 11px;
  border-radius: 14px;
}
.channel-row:hover,
.channel-row.selected {
  background: var(--soft);
  box-shadow: inset 3px 0 var(--orange);
}
.channel-row img {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-fit: cover;
}
.channel-row span {
  min-width: 0;
}
.channel-row b,
.channel-row small {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.channel-row small {
  color: var(--muted);
  margin-top: 3px;
}
.editor {
  min-width: 0;
}
.identity-card {
  overflow: hidden;
  margin-bottom: 18px;
}
.cover {
  height: 210px;
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 16px;
}
.image-button {
  background: #111d;
  color: #fff;
  padding: 9px 14px;
  border-radius: 999px;
}
.image-button input,
.avatar-button input,
.upload-cover input {
  display: none;
}
.identity {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
}
.avatar-wrap {
  position: relative;
  margin-top: -54px;
}
.avatar-wrap img {
  width: 94px;
  height: 94px;
  border: 4px solid var(--panel);
  border-radius: 50%;
  object-fit: cover;
}
.avatar-button {
  position: absolute;
  right: 0;
  bottom: 2px;
  width: 31px;
  height: 31px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--orange);
  color: #fff;
  font-size: 1.35rem;
}
.identity h2 {
  margin: 0;
  font: 700 1.55rem Georgia;
}
.identity p {
  margin: 3px 0;
  color: var(--muted);
}
.locked {
  margin-left: auto;
  font-size: 0.78rem;
}
.panel {
  padding: 22px;
  margin-bottom: 18px;
}
.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
}
.panel-title h3 {
  font: 700 1.35rem Georgia;
  margin: 0 0 4px;
}
.primary,
.post-list button,
.management-panel button {
  border: 0;
  background: var(--orange);
  color: #fff;
  border-radius: 999px;
  padding: 10px 16px;
  font-weight: 800;
}
.fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.fields .panel-title,
.fields .wide {
  grid-column: 1/-1;
}
label {
  font-weight: 700;
  font-size: 0.85rem;
}
input,
textarea,
select {
  box-sizing: border-box;
  width: 100%;
  margin-top: 7px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--input);
  color: var(--text);
  padding: 12px;
  font: inherit;
}
.import-list {
  display: grid;
  gap: 18px;
  margin-top: 22px;
}
.drop-folder {
  margin-top: 20px;
  padding: 16px 18px;
  border: 1px dashed var(--line);
  border-radius: 14px;
  background: var(--soft);
}
.drop-folder p {
  margin: 6px 0 0;
  color: var(--muted);
}
.drop-folder code {
  overflow-wrap: anywhere;
  color: var(--text);
}
.drop-folder details {
  margin-top: 12px;
  color: var(--orange);
}
.import-card {
  display: grid;
  gap: 15px;
  padding: 22px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--card);
}
.draft-cover {
  display: grid;
  grid-template-columns: minmax(180px, 320px) 1fr;
  gap: 18px;
  align-items: center;
}
.draft-cover > img,
.cover-placeholder {
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 14px;
  border: 1px solid var(--line);
  object-fit: cover;
}
.cover-placeholder {
  display: grid;
  place-content: center;
  gap: 6px;
  text-align: center;
  background: var(--soft);
  color: var(--muted);
}
.cover-placeholder span {
  font-size: 2rem;
}
.draft-cover p {
  color: var(--muted);
  margin: 5px 0 12px;
}
.file-action,
.management-panel .remove-cover {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 9px 14px;
  cursor: pointer;
}
.file-action {
  background: var(--orange);
  color: #fff;
}
.file-action input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
.management-panel .remove-cover {
  margin-left: 8px;
  background: transparent;
  color: var(--orange);
  border: 1px solid var(--orange);
}
.import-meta,
.import-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.import-meta a {
  margin-left: auto;
  color: var(--orange);
  font-weight: 750;
}
.proposed-channel {
  display: block;
  margin-top: 7px;
  color: var(--orange);
  line-height: 1.45;
}
.management-panel .new-channel-toggle {
  display: inline-flex;
  margin-top: 10px;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--orange);
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.new-channel-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  padding: 18px;
  border: 1px solid var(--orange);
  border-radius: 16px;
  background: var(--soft);
}
.new-channel-heading,
.new-channel-form > label:last-of-type,
.new-channel-actions {
  grid-column: 1 / -1;
}
.new-channel-heading,
.new-channel-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.new-channel-heading p {
  margin: 4px 0 0;
  color: var(--muted);
}
.management-panel .close-channel-form {
  padding: 4px 10px;
  border: 0;
  background: transparent;
  color: var(--text);
  font-size: 1.6rem;
}
.channel-handle-input {
  display: flex;
  align-items: center;
  margin-top: 7px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--input);
  padding-left: 12px;
}
.channel-handle-input input {
  margin: 0;
  border: 0;
  background: transparent;
}
.new-channel-actions {
  justify-content: flex-end;
}
.import-actions {
  justify-content: flex-end;
  flex-wrap: wrap;
}
.management-panel .quiet-action {
  background: var(--soft);
  color: var(--text);
  border: 1px solid var(--line);
}
.management-panel .danger {
  background: transparent;
  color: var(--orange);
  border: 1px solid var(--orange);
}
@media (max-width: 680px) {
  .draft-cover {
    grid-template-columns: 1fr;
  }
  .new-channel-form {
    grid-template-columns: 1fr;
  }
  .new-channel-form > * {
    grid-column: 1;
  }
}
textarea {
  resize: vertical;
  line-height: 1.6;
}
.wide small {
  float: right;
  color: var(--muted);
}
.handle {
  display: flex;
  align-items: center;
  margin-top: 7px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--input);
  padding-left: 12px;
}
.handle input {
  border: 0;
  margin: 0;
}
.post-form {
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 18px;
}
.post-form label {
  display: block;
  margin: 14px 0;
}
.form-heading,
.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}
.quiet {
  background: none;
  border: 0;
  color: var(--muted);
}
.upload-cover {
  border: 1px solid var(--line);
  padding: 9px 13px;
  border-radius: 999px;
}
.post-actions span {
  color: var(--muted);
  font-size: 0.8rem;
}
.post-list {
  display: grid;
  gap: 9px;
}
.post-list article {
  display: grid;
  grid-template-columns: 88px 1fr auto;
  gap: 14px;
  align-items: center;
  border-top: 1px solid var(--line);
  padding: 12px 0;
}
.post-list img {
  width: 88px;
  height: 62px;
  object-fit: cover;
  border-radius: 10px;
}
.post-list h4 {
  margin: 3px 0;
  font: 700 1rem Georgia;
}
.post-list span {
  color: var(--orange);
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 800;
}
.post-list small {
  color: var(--muted);
}
.management-panel {
  padding: 26px;
}
.section-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line);
}
.folder-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.65rem;
}
.browser-folder-note {
  margin: 1.25rem 0;
  padding: 1rem 1.2rem;
  border: 1px dashed var(--line);
  border-radius: 1rem;
  background: var(--surface-soft);
}
.browser-folder-note p {
  margin: 0.35rem 0 0;
}
.folder-errors {
  color: var(--danger, #b42318);
  font-weight: 700;
}
.section-heading h2 {
  margin: 5px 0;
  font: 700 2rem Georgia;
}
.directory-search {
  width: min(320px, 45%);
}
.recovery-card {
  margin: 20px 0;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--orange) 32%, var(--line));
  border-radius: 16px;
  background: color-mix(in srgb, var(--orange) 6%, var(--panel));
}
.recovery-card h3 {
  margin: 5px 0 12px;
}
.recovery-card article {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
}
.recovery-card img,
.user-card img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}
.recovery-card article > span {
  display: grid;
  flex: 1;
}
.recovery-card small {
  color: var(--muted);
}
.user-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;
}
.user-card {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
}
.user-card div {
  min-width: 0;
}
.user-card h3,
.user-card p,
.user-card small {
  overflow: hidden;
  margin: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-card h3 {
  font-size: 0.95rem;
}
.user-card p {
  margin-top: 4px;
  color: var(--text);
  font-size: 0.78rem;
}
.user-card small {
  display: block;
  margin-top: 3px;
  color: var(--muted);
  font-size: 0.72rem;
}
.role {
  align-self: start;
  padding: 5px 8px;
  border-radius: 999px;
  background: var(--soft);
  color: var(--muted);
  font-size: 0.6rem;
  font-weight: 800;
  text-transform: uppercase;
}
.user-card .danger,
.notification-list .danger {
  grid-column: 3;
  padding: 6px 9px;
  border: 1px solid color-mix(in srgb, var(--orange) 45%, var(--line));
  background: transparent;
  color: var(--orange);
  font-size: 0.65rem;
}
.notification-list {
  margin-top: 6px;
}
.notification-list article {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto auto;
  gap: 12px;
  align-items: center;
  padding: 16px 4px;
  border-bottom: 1px solid var(--line);
}
.notification-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: var(--soft);
  color: var(--orange);
  font-weight: 900;
}
.notification-list article > div {
  display: grid;
}
.notification-list small {
  margin-top: 4px;
  color: var(--muted);
  font-size: 0.68rem;
  text-transform: capitalize;
}
.unread-label {
  padding: 5px 8px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--orange) 12%, var(--panel));
  color: var(--orange);
  font-size: 0.62rem;
  font-weight: 800;
}
.toast {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: #141414;
  color: #fff;
  padding: 12px 18px;
  border-radius: 999px;
  z-index: 50;
}
.empty {
  padding: 50px;
  text-align: center;
  color: var(--muted);
}
@media (max-width: 800px) {
  main {
    padding: 90px 12px;
  }
  .studio-head {
    align-items: start;
    flex-direction: column;
    padding: 22px;
  }
  .channel-grid {
    grid-template-columns: 1fr;
  }
  .channel-list {
    position: static;
    display: flex;
    overflow-x: auto;
  }
  .channel-list .search {
    min-width: 170px;
  }
  .channel-row {
    min-width: 220px;
  }
  .cover {
    height: 150px;
  }
  .identity {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .locked {
    margin-left: 0;
  }
  .fields {
    grid-template-columns: 1fr;
  }
  .post-list article {
    grid-template-columns: 62px 1fr auto;
  }
  .post-list img {
    width: 62px;
  }
  .stats {
    display: none;
  }
  .tabs {
    overflow-x: auto;
  }
  .tabs button {
    flex: 0 0 auto;
  }
  .management-panel {
    padding: 18px;
  }
  .section-heading {
    align-items: start;
    flex-direction: column;
  }
  .directory-search {
    width: 100%;
  }
  .user-grid {
    grid-template-columns: 1fr;
  }
  .notification-list article {
    grid-template-columns: 38px minmax(0, 1fr) auto;
  }
  .notification-list .unread-label {
    display: none;
  }
  .notification-list .danger {
    grid-column: 3;
  }
  .user-card {
    grid-template-columns: 48px minmax(0, 1fr) auto;
  }
}
</style>
