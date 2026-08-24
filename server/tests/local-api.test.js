import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const port = 31991
const origin = `http://127.0.0.1:${port}`
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blugbug-test-'))
let child
let cookie = ''
let postId = ''

const request = async (url, options = {}) => {
  const response = await fetch(`${origin}${url}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'content-type': 'application/json' }
        : {}),
      ...(cookie ? { cookie } : {}),
      ...options.headers
    }
  })
  const setCookie = response.headers.get('set-cookie')
  if (setCookie) cookie = setCookie.split(';')[0]
  const body = response.status === 204 ? null : await response.json()
  return { response, body }
}

before(async () => {
  child = spawn(process.execPath, ['server/index.js'], {
    cwd: path.resolve('.'),
    env: {
      ...process.env,
      LOCAL_API_PORT: String(port),
      LOCAL_DATA_DIR: dataDir,
      LOCAL_LOGIN_USERNAME: 'tester',
      LOCAL_LOGIN_PASSWORD: 'secret'
    },
    stdio: 'ignore'
  })
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(`${origin}/api/health`)).ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Test server did not start.')
})

after(async () => {
  if (child && child.exitCode === null) {
    const exited = new Promise((resolve) => child.once('exit', resolve))
    child.kill()
    await exited
  }
  fs.rmSync(dataDir, { recursive: true, force: true })
})

test('rejects protected API without a session', async () => {
  assert.equal((await request('/api/posts')).response.status, 401)
})

test('serves public blugs with item-specific social preview metadata', async () => {
  const publicPost = await request('/api/public/posts/seed-01')
  assert.equal(publicPost.response.status, 200)
  assert.equal(publicPost.body.post.title, 'Designing a Morning That Actually Belongs to You')
  const preview = await fetch(`${origin}/blug/seed-01`)
  const html = await preview.text()
  assert.equal(preview.status, 200)
  assert.match(
    html,
    /property="og:title" content="Designing a Morning That Actually Belongs to You"/
  )
  assert.match(html, /property="og:image" content="http:\/\/127\.0\.0\.1:31991\//)
  assert.match(html, /name="twitter:card" content="summary"/)
  assert.match(html, /Read this Blug on Blugbug/)
  const secondHtml = await (await fetch(`${origin}/blug/history-yoruba`)).text()
  assert.match(
    secondHtml,
    /property="og:title" content="Yoruba Culture: Cities, Oríkì, and a Living Artistic Tradition"/
  )
  assert.doesNotMatch(secondHtml, /Designing a Morning That Actually Belongs to You/)
})

test('logs in with preset credentials and restores session', async () => {
  const login = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'tester', password: 'secret' })
  })
  assert.equal(login.response.status, 200)
  assert.equal(login.body.user.role, 'admin')
  assert.equal((await request('/api/auth/session')).body.user.id, 'local-admin')
})

test('creates sanitized posts and supports interactions', async () => {
  const created = await request('/api/posts', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test', content: '<p>safe</p><script>bad()</script>' })
  })
  assert.equal(created.response.status, 201)
  postId = created.body.post.id
  assert.doesNotMatch(created.body.post.content, /script/)
  assert.equal(
    (await request(`/api/posts/${postId}/likes`, { method: 'PUT' })).response.status,
    204
  )
  assert.equal(
    (await request(`/api/posts/${postId}/bookmarks`, { method: 'PUT' })).response.status,
    204
  )
  assert.equal(
    (
      await request(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: 'Comment' })
      })
    ).response.status,
    201
  )
  const asked = await request(`/api/posts/${postId}/paragraph-questions`, {
    method: 'POST',
    body: JSON.stringify({ paragraphIndex: 0, body: 'What does this point mean?' })
  })
  assert.equal(asked.response.status, 201)
  assert.equal(
    (
      await request(`/api/paragraph-questions/${asked.body.question.id}/answer`, {
        method: 'PATCH',
        body: JSON.stringify({ body: 'This is the blugger’s answer.' })
      })
    ).response.status,
    200
  )
  const paragraphQuestions = (await request(`/api/posts/${postId}/paragraph-questions`)).body
    .questions
  assert.equal(paragraphQuestions[0].author_response, 'This is the blugger’s answer.')
  const state = (await request(`/api/posts/${postId}/interactions`)).body
  assert.deepEqual(state, { likes: 1, bookmarks: 1, liked: true, bookmarked: true })
})

test('seeds followable editorial channel profiles and their archives', async () => {
  const users = (await request('/api/users')).body.users
  const history = users.find((user) => user.id === 'channel-history-ng')
  assert.equal(history.full_name, 'History Nigeria')
  assert.equal(history.role, 'user')
  const posts = (await request('/api/posts?userId=channel-history-ng')).body.posts
  assert.equal(posts.length, 10)
  assert.equal(
    (await request('/api/social/follows/channel-history-ng', { method: 'PUT' })).response.status,
    204
  )
  assert.equal((await request('/api/social/status/channel-history-ng')).body.following, true)
})

test('seeds demo followers and notifications for the local profile', async () => {
  const followers = (await request('/api/social/followers/local-admin')).body.users
  assert.ok(followers.length >= 5)
  const notifications = (await request('/api/notifications')).body.notifications
  assert.ok(notifications.length >= 7)
  assert.ok(notifications.some((item) => item.type === 'comment'))
})

test('creates support cases and exposes admin overview', async () => {
  const supportCase = await request('/api/support/cases', {
    method: 'POST',
    body: JSON.stringify({ subject: 'Help', body: 'Testing' })
  })
  assert.equal(supportCase.response.status, 201)
  assert.equal(
    (await request(`/api/support/cases/${supportCase.body.case.id}/messages`)).body.messages.length,
    1
  )
  const overview = await request('/api/admin/overview')
  assert.equal(overview.response.status, 200)
  assert.ok(overview.body.posts >= 11)
})

test('deletes a post and its relational data', async () => {
  assert.equal((await request(`/api/posts/${postId}`, { method: 'DELETE' })).response.status, 204)
  assert.equal((await request(`/api/posts/${postId}`)).response.status, 404)
})
