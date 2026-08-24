import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { channelPosts, channelUsers } from './channel-seeds.js'

const serverDir = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(serverDir, '..')
const dataDir = process.env.LOCAL_DATA_DIR
  ? path.resolve(process.env.LOCAL_DATA_DIR)
  : path.join(projectDir, 'data')
const uploadsDir = path.join(dataDir, 'uploads')

fs.mkdirSync(uploadsDir, { recursive: true })

export const db = new Database(path.join(dataDir, 'blugbug.sqlite'))
db.pragma('foreign_keys = ON')
db.pragma('journal_mode = WAL')

for (const file of fs
  .readdirSync(path.join(serverDir, 'migrations'))
  .filter((name) => name.endsWith('.sql'))
  .sort()) {
  db.exec(fs.readFileSync(path.join(serverDir, 'migrations', file), 'utf8'))
}
if (
  !db
    .prepare('PRAGMA table_info(posts)')
    .all()
    .some((column) => column.name === 'header_image_url')
) {
  db.exec('ALTER TABLE posts ADD COLUMN header_image_url TEXT')
}
const importDraftColumns = db.prepare('PRAGMA table_info(import_drafts)').all()
if (!importDraftColumns.some((column) => column.name === 'proposed_channel_name')) {
  db.exec("ALTER TABLE import_drafts ADD COLUMN proposed_channel_name TEXT NOT NULL DEFAULT ''")
}
if (!importDraftColumns.some((column) => column.name === 'proposed_channel_handle')) {
  db.exec("ALTER TABLE import_drafts ADD COLUMN proposed_channel_handle TEXT NOT NULL DEFAULT ''")
}

db.prepare(
  `
  INSERT INTO users (id, username, email, full_name, chatter_name, role, profile_image_url, header_image_url)
  VALUES ('local-admin', 'admin', 'admin@blugbug.local', 'Local Administrator', 'admin', 'admin', '/Default_pfp.svg', '/Default_Header.svg')
  ON CONFLICT(id) DO NOTHING
`
).run()

db.prepare(
  `
  UPDATE users
  SET profile_image_url = COALESCE(NULLIF(profile_image_url, ''), '/Default_pfp.svg'),
      header_image_url = COALESCE(NULLIF(header_image_url, ''), '/Default_Header.svg')
  WHERE id = 'local-admin'
`
).run()

const article = (...paragraphs) => paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('')
const seedPosts = [
  [
    'seed-01',
    'local-admin',
    'Designing a Morning That Actually Belongs to You',
    'Life',
    article(
      'The first hour of the day does not need to be productive to be valuable. Mine begins with water, an open window, and ten quiet minutes without a screen or a list of demands.',
      'That small pocket of quiet changes the shape of everything after it. I can tell the difference between work that matters and work that is simply loud, and I enter conversations with more patience.',
      'A gentle start is not wasted time. It is a boundary that lets you decide what deserves your attention before the world decides for you.'
    )
  ],
  [
    'seed-02',
    'local-admin',
    'The Tiny Lagos Cafés Doing Big Things',
    'Culture',
    article(
      'Some of the city’s best conversations happen around six tables, a humming espresso machine, and playlists chosen by whoever arrived first. These rooms are small, but the ideas moving through them are not.',
      'Independent cafés have become informal studios, meeting rooms, and living rooms for a creative generation. A designer edits beside a student, while two founders test a pitch over small cups of coffee.',
      'What makes these places special is not just the menu. It is the permission to stay, notice familiar faces, and slowly become part of a neighborhood rhythm.'
    )
  ],
  [
    'seed-03',
    'local-admin',
    'What I Learned Building My First Side Project',
    'Tech',
    article(
      'I thought the difficult part would be writing code. It was choosing what not to build. Every new idea felt necessary until the project became too large to explain in one sentence.',
      'The breakthrough came when I reduced it to one promise: help one person finish one task with less friction. That sentence became a filter for features, design decisions, and the bugs worth fixing first.',
      'Shipping a smaller honest product taught me more than planning a perfect one. Real feedback arrived only after I stopped polishing possibilities and gave people something they could actually use.'
    )
  ],
  [
    'seed-04',
    'local-admin',
    'A Beginner’s Guide to Slow Travel',
    'Travel',
    article(
      'Slow travel begins when you stop treating a city like a checklist. Stay in one neighborhood, learn the route to the market, and return to the same food stall twice.',
      'Repetition reveals details that a rushed itinerary hides: when the bakery sells out, which street becomes lively after sunset, and how the mood changes when rain arrives.',
      'You may see fewer landmarks, but you leave with a stronger sense of place. The best souvenir is often the feeling that, for a short while, you understood the ordinary life of somewhere new.'
    )
  ],
  [
    'seed-05',
    'local-admin',
    'Five Meals I Cook When Life Gets Loud',
    'Food',
    article(
      'Comfort food does not have to be complicated. A dependable pot of jollof, coconut noodles, roasted vegetables, beans, and warm bread can carry an entire difficult week.',
      'I keep the ingredients flexible and the methods familiar. The goal is not to impress anyone; it is to make tomorrow easier by cooking enough tonight and leaving the kitchen calmer than I found it.',
      'These meals work because they forgive substitutions and interruptions. When life is loud, feeding yourself well can be a small but meaningful way to regain control.'
    )
  ],
  [
    'seed-06',
    'local-admin',
    'Why Your Creative Work Needs Boring Systems',
    'Creativity',
    article(
      'Inspiration gets the credit, but routine does the lifting. A named folder, a weekly review, and a small publishing deadline protect ideas from disappearing.',
      'A good system removes decisions from the moment when your energy is lowest. You already know where drafts belong, what the next step is, and when unfinished work will receive attention again.',
      'The system should be boring enough to trust and light enough to maintain. Creativity still brings the surprise; structure simply makes sure you are present when it arrives.'
    )
  ],
  [
    'seed-07',
    'local-admin',
    'Money Habits I Wish I Started at Twenty',
    'Finance',
    article(
      'Automate a small amount, track the big categories instead of every breath, and build an emergency buffer before chasing impressive returns. Simple habits are less exciting but easier to repeat.',
      'The biggest change came when I gave every payday a plan before spending began. Saving stopped feeling like a punishment at the end of the month and became one of the bills I paid to my future self.',
      'Money advice should make life calmer, not more shameful. Start with an amount that feels almost too easy, increase it slowly, and let consistency do the work that motivation cannot.'
    )
  ],
  [
    'seed-08',
    'local-admin',
    'The Case for Walking Without Headphones',
    'Wellness',
    article(
      'A quiet walk lets unfinished thoughts catch up. You notice your breathing, the weather, and how much of the day you have been rushing through without really arriving anywhere.',
      'Without a soundtrack, the neighborhood becomes interesting again: conversations passing at a distance, trees moving in the wind, and the soft machinery of ordinary life.',
      'Not every walk needs to be exercise or entertainment. Sometimes twenty unfilled minutes are enough to untangle a problem and return home feeling more available to yourself.'
    )
  ],
  [
    'seed-09',
    'local-admin',
    'How to Read More Without Making It a Chore',
    'Books',
    article(
      'Keep one easy book beside one demanding book. Read according to your energy, abandon what does not hold you, and count rereading as reading.',
      'The habit became easier when I stopped treating every book like an assignment. Ten absorbed pages are more valuable than fifty pages crossed with no memory of what happened.',
      'Reading grows through curiosity rather than guilt. Leave books where your attention naturally pauses, talk about them with friends, and allow your reading life to change with your season of life.'
    )
  ],
  [
    'seed-10',
    'local-admin',
    'Building Community One Reply at a Time',
    'Community',
    article(
      'Audience is a number. Community is recognition. It grows when people remember each other, return to conversations, and make room for a thoughtful reply.',
      'Posting is only the opening gesture. The deeper work is listening closely enough to ask a better question, welcoming disagreement without performance, and noticing who has not yet been heard.',
      'A healthy community feels less like a crowd facing a stage and more like a table that can expand. Every generous reply adds another chair.'
    )
  ]
]

const sampleUsers = [
  [
    'sample-amina',
    'amina',
    'amina@sample.blugbug',
    'Amina Cole',
    'amina.football',
    'Football writer following tactics, supporters, and the stories around the Premier League.'
  ],
  [
    'sample-leo',
    'leo',
    'leo@sample.blugbug',
    'Leo Martins',
    'leowatches',
    'Film lover writing about blockbusters, performances, animation, and the joy of a crowded cinema.'
  ],
  [
    'sample-nia',
    'nia',
    'nia@sample.blugbug',
    'Nia Okafor',
    'niabooks',
    'Reader, essay collector, and lifelong defender of public libraries.'
  ],
  [
    'sample-jay',
    'jay',
    'jay@sample.blugbug',
    'Jay Chen',
    'buildwithjay',
    'Product designer interested in humane technology and small useful tools.'
  ],
  [
    'sample-zuri',
    'zuri',
    'zuri@sample.blugbug',
    'Zuri Mensah',
    'zuriliving',
    'Food, city life, personal style, and the rituals that make ordinary days memorable.'
  ]
]
const insertSampleUser = db.prepare(
  `INSERT OR IGNORE INTO users (id,username,email,full_name,chatter_name,about_me,role,profile_image_url,header_image_url) VALUES (?,?,?,?,?,?,'user','/Default_pfp.svg','/Default_Header.svg')`
)
sampleUsers.forEach((user) => insertSampleUser.run(...user))
channelUsers.forEach((user) => insertSampleUser.run(...user))
const seedFollow = db.prepare(
  `INSERT OR IGNORE INTO follows (follower_id,followed_id) VALUES ('local-admin',?)`
)
;['sample-amina', 'sample-leo', 'sample-nia'].forEach((id) => seedFollow.run(id))

const communityPosts = [
  [
    'amina-01',
    'sample-amina',
    'The Premier League Is Back: Five Questions Before the First Whistle',
    'Sports',
    article(
      'A new Premier League season always arrives carrying confidence, panic, and several weeks of transfer-window arguments. Every club believes the summer has solved something, but opening weekend has a way of exposing unfinished work.',
      'I am watching five things: whether promoted teams stay brave, which new manager settles fastest, how title contenders manage midfield control, whose young forward earns real minutes, and which supporter base discovers unexpected hope.',
      'Predictions are fun, but the first month is really about evidence. Shape, fitness, and decision-making tell us more than preseason headlines ever could.'
    )
  ],
  [
    'amina-02',
    'sample-amina',
    'Why the Best Football Gist Starts After the Final Whistle',
    'Sports',
    article(
      'The match ends, but the story rarely does. The walk home, voice notes from friends, and arguments over one substitution are where football becomes personal.',
      'Good football gist is not only about proving who understands tactics. It is memory, rivalry, humor, and the strange optimism that makes a supporter believe next weekend will be different.',
      'I want our sports corner to feel like that conversation: informed enough to teach us something and warm enough to leave room for joy.'
    )
  ],
  [
    'amina-03',
    'sample-amina',
    'Three Tactical Battles That Decide Big Matches',
    'Sports',
    article(
      'Big games are often described through star players, yet their shape is usually decided in less glamorous spaces: the passing lane behind a pressing forward, the fullback left alone, or the midfielder receiving on the turn.',
      'Watch how teams protect the center, where they create overloads, and what happens immediately after possession changes. Those moments reveal the manager’s real risk tolerance.',
      'You do not need a coaching badge to enjoy tactics. Pick one relationship on the pitch and follow it for ten minutes; the match will begin to look entirely different.'
    )
  ],
  [
    'amina-04',
    'sample-amina',
    'The Away-Day Rituals Supporters Never Forget',
    'Sports',
    article(
      'An away day begins before the stadium appears. It lives in the early train, the same scarf, the food stop everyone pretends not to care about, and songs growing louder as strangers become a temporary family.',
      'The result matters, but the journey gives the day its texture. Even a terrible performance can become a story retold for years because of who was standing beside you.',
      'Football belongs to schedules and statistics, but supporters preserve it through ritual. That is why certain trips remain vivid long after the table is forgotten.'
    )
  ],
  [
    'amina-05',
    'sample-amina',
    'Give Young Players Time Before Calling Them Flops',
    'Sports',
    article(
      'A young signing can be judged by millions before learning the route to training. One missed chance becomes a label, and a difficult month becomes a verdict.',
      'Development is rarely linear. New leagues demand different timing, physical habits, language, and confidence. Coaches can protect players, but supporters and media also shape the atmosphere around them.',
      'Analysis should still be honest, but patience is part of honest analysis. We should describe what is happening without pretending we already know the ending.'
    )
  ],
  [
    'leo-01',
    'sample-leo',
    'Why Spider-Man Still Works in Every Generation',
    'Film',
    article(
      'Spider-Man survives reinvention because the fantasy is always tied to an ordinary problem. Beneath the mask is someone late for school, worried about rent, disappointing a friend, or trying to do the right thing without applause.',
      'The best versions understand that swinging through a city is thrilling because the person doing it still feels small inside that city. Power expands the stakes, but responsibility keeps the story human.',
      'Every generation changes the suit, the music, and the visual language. The emotional engine remains the same: anyone can be brave before they feel ready.'
    )
  ],
  [
    'leo-02',
    'sample-leo',
    'The Movie Theater Is Still Worth Defending',
    'Film',
    article(
      'Streaming is convenient, but a theater asks for a different kind of attention. The lights disappear, the phone stays away, and a room full of strangers agrees to care about the same images for two hours.',
      'A laugh becomes larger when it travels across rows. Silence becomes heavier when everyone feels it together. Even an imperfect movie can become memorable because of the audience around it.',
      'The cinema does not need to defeat the living room. It only needs to protect the experience that cannot be paused, minimized, or half-watched.'
    )
  ],
  [
    'leo-03',
    'sample-leo',
    'A Great Villain Needs More Than a Dark Costume',
    'Film',
    article(
      'The villains we remember are not simply cruel; they are specific. They want something understandable, choose a frightening method, and reveal a weakness the hero would rather ignore.',
      'A strong antagonist changes the story whenever they enter it. Their choices create pressure, their worldview raises a real question, and their presence forces the hero to pay a meaningful price.',
      'Spectacle can make a villain look dangerous. Character is what makes the danger stay with us after the credits.'
    )
  ],
  [
    'leo-04',
    'sample-leo',
    'Animation Is a Medium, Not a Children’s Genre',
    'Film',
    article(
      'Animation can hold comedy, grief, horror, romance, and ideas too strange for a camera to capture. Calling it a children’s genre mistakes a production method for an audience.',
      'Its greatest strength is total intention. Every movement, color, shadow, and background must be chosen, which allows filmmakers to build emotional worlds with unusual precision.',
      'Children deserve ambitious art, but adults should not need permission to meet animation on its own terms. The form is limitless when viewers stop placing it in a small box.'
    )
  ],
  [
    'leo-05',
    'sample-leo',
    'The Quiet Performance That Saved the Whole Film',
    'Film',
    article(
      'Some performances announce themselves through speeches. Others work in pauses, glances, and the careful way a character avoids saying what the audience already understands.',
      'A quiet actor can stabilize an entire movie by making its world believable. They listen on screen, react without demanding focus, and give louder scenes an emotional foundation.',
      'Awards often favor transformation, but restraint is also craft. Sometimes the smallest performance is the reason every other part of a film feels true.'
    )
  ],
  [
    'nia-01',
    'sample-nia',
    'The Library Card Is Still the Best Subscription',
    'Books',
    article(
      'A library card offers books, quiet, research help, community events, and the rare freedom to explore without turning every curiosity into a purchase.',
      'Libraries make room for wandering. You can borrow a subject you know nothing about, return it without guilt, and follow the next question wherever it leads.',
      'Their value is not nostalgia. A public library is active infrastructure for attention, learning, and belonging—available to people before anyone asks what they can afford.'
    )
  ],
  [
    'nia-02',
    'sample-nia',
    'Reading Two Books at Once Fixed My Reading Slump',
    'Books',
    article(
      'I used to believe finishing one book before opening another was a sign of discipline. In practice, it made reading feel like waiting at a locked door.',
      'Now I keep one demanding book and one welcoming book nearby. The choice lets me match reading to my energy without abandoning the habit entirely.',
      'A reading life does not need to look orderly from the outside. It needs enough flexibility to keep curiosity alive.'
    )
  ],
  [
    'nia-03',
    'sample-nia',
    'What Marginal Notes Reveal About a Reader',
    'Books',
    article(
      'A marked page records a meeting between a sentence and a particular version of you. Years later, the underline may feel obvious, mysterious, or completely wrong.',
      'That is what makes annotations valuable. They preserve attention rather than authority, showing where you resisted, recognized yourself, or wanted to remember a phrase.',
      'Books change because readers change. A margin gives those changing selves a place to encounter one another.'
    )
  ],
  [
    'nia-04',
    'sample-nia',
    'Short Stories Teach Us How to Pay Attention',
    'Books',
    article(
      'A short story cannot rely on endless explanation. A room, gesture, or repeated object must carry more than one meaning without calling attention to the work.',
      'Reading the form trains us to notice pressure beneath ordinary language. The ending may close the plot while opening a larger emotional question.',
      'A great short story is not a smaller novel. It is a precise instrument designed to leave one part of the mind ringing.'
    )
  ],
  [
    'nia-05',
    'sample-nia',
    'Stop Apologizing for Rereading Your Favorite Book',
    'Books',
    article(
      'Rereading is sometimes treated as retreat, as though curiosity only moves forward. But a familiar book lets you notice structure and meaning that suspense hid the first time.',
      'The text remains still while your life changes around it. A scene that once felt minor may become the center because experience has taught you how to see it.',
      'Returning is not refusing discovery. It is discovering that neither a book nor its reader is ever exactly the same twice.'
    )
  ],
  [
    'jay-01',
    'sample-jay',
    'The Best App Feature Might Be the One You Remove',
    'Tech',
    article(
      'Teams often measure progress by addition, but every feature creates choices, maintenance, and another promise to the user. More capability can quietly produce less clarity.',
      'Removing a feature is useful when it restores the main path. The decision should come from behavior and purpose, not a desire to make an interface look empty.',
      'Good product design is not minimal for fashion. It is selective so the important action feels obvious and dependable.'
    )
  ],
  [
    'jay-02',
    'sample-jay',
    'Designing Notifications That Respect People',
    'Tech',
    article(
      'A notification interrupts a real moment, so earning permission is not enough. Products should also earn the interruption each time they send one.',
      'Useful alerts are timely, specific, and actionable. They group repetition, avoid manufactured urgency, and make silence easy to choose.',
      'Attention is not a resource an app owns. Respectful design treats it as something borrowed briefly and returned in good condition.'
    )
  ],
  [
    'jay-03',
    'sample-jay',
    'Why Local-First Software Feels Calm',
    'Tech',
    article(
      'Local-first software gives people a simple promise: the work is available where it was created, even when a distant service is unavailable.',
      'That technical choice changes the emotional experience. Saving feels immediate, ownership feels clearer, and temporary network trouble does not become a crisis.',
      'Cloud collaboration remains valuable, but it should extend a dependable local foundation rather than hold every piece of work hostage to a connection.'
    )
  ],
  [
    'jay-04',
    'sample-jay',
    'A Useful Side Project Does Not Need to Become a Startup',
    'Tech',
    article(
      'Some ideas deserve to remain small. They can solve a narrow problem, teach their maker something, and serve a handful of people without becoming a company.',
      'The pressure to monetize everything can replace curiosity with administration. A small project has permission to be strange, generous, and complete.',
      'Success might be one tool that keeps working and one person who is glad it exists. That can be enough.'
    )
  ],
  [
    'jay-05',
    'sample-jay',
    'The Hidden Cost of Making Every Screen a Dashboard',
    'Design',
    article(
      'Dashboards promise control by placing every metric in view. Too often they ask people to interpret the system before they can complete a simple task.',
      'Information belongs on screen when it changes a decision. Everything else can move closer to the moment when it becomes useful.',
      'A calm interface is not one without data. It is one that understands sequence, priority, and the difference between visibility and value.'
    )
  ],
  [
    'zuri-01',
    'sample-zuri',
    'The Sunday Table Is More Than the Food',
    'Food',
    article(
      'Sunday meals carry a different clock. Someone arrives early to chop, someone brings a dish without being asked, and conversation stretches long after plates are cleared.',
      'The recipes matter, but repetition creates the ritual. Familiar flavors tell everyone they have returned to a place where their presence is expected.',
      'A shared table is one of the simplest ways a family or group of friends can keep choosing one another.'
    )
  ],
  [
    'zuri-02',
    'sample-zuri',
    'Getting Dressed Can Be a Small Creative Practice',
    'Style',
    article(
      'Personal style becomes interesting when it stops chasing approval and starts paying attention. Color, texture, proportion, and repetition can turn an ordinary morning into a small composition.',
      'The most useful wardrobe is not the largest one. It is a collection that supports real days and still leaves room for play.',
      'Getting dressed will not solve a difficult week, but choosing how to meet the day can restore a little agency.'
    )
  ],
  [
    'zuri-03',
    'sample-zuri',
    'The Corner Shop Knows the Neighborhood',
    'Culture',
    article(
      'A corner shop keeps a quiet record of local life: school rushes, late dinners, familiar orders, and the weather discussed by people who only know each other from the counter.',
      'These places offer more than convenience. Their owners notice absences, share recommendations, and provide the small continuity that makes a street feel inhabited.',
      'Cities are shaped by grand buildings, but belonging often grows in rooms small enough to remember your name.'
    )
  ],
  [
    'zuri-04',
    'sample-zuri',
    'Cook Once, Make Three Different Dinners',
    'Food',
    article(
      'Batch cooking becomes boring when every plate repeats itself. I prefer to prepare one flexible base and change the meal around it.',
      'Roasted vegetables can meet rice and pepper sauce, fold into a warm flatbread, or become a quick soup with beans and stock. The work stays useful without making dinner predictable.',
      'The goal is not perfect meal preparation. It is giving your tired future self several good choices.'
    )
  ],
  [
    'zuri-05',
    'sample-zuri',
    'How to Host Friends Without Performing Perfection',
    'Life',
    article(
      'Hospitality gets easier when the goal changes from impressing people to making them comfortable. Clean one room, cook something forgiving, and let guests help.',
      'The evenings people remember are rarely the ones where every detail matched. They remember being welcomed, introduced thoughtfully, and invited to stay a little longer.',
      'A home does not need to look finished before it can hold a good conversation. Warmth is the part no decoration can replace.'
    )
  ]
]

// Seed content is a starting point. Never overwrite content subsequently managed in Admin Studio.
const seedPost = db.prepare(
  `INSERT OR IGNORE INTO posts (id,user_id,title,content,categories,status,created_at) VALUES (?,?,?,?,?,'published',datetime('now',?))`
)
const allSeedPosts = [...seedPosts, ...communityPosts, ...channelPosts]
allSeedPosts.forEach(([id, userId, title, category, content], index) =>
  seedPost.run(id, userId, title, content, category, `-${allSeedPosts.length - index} hours`)
)

const demoFollowers = [
  'sample-jay',
  'sample-zuri',
  'channel-history-ng',
  'channel-super-eagles',
  'channel-naija-music'
]
const insertDemoFollower = db.prepare(
  `INSERT OR IGNORE INTO follows (follower_id, followed_id, created_at) VALUES (?, 'local-admin', datetime('now', ?))`
)
demoFollowers.forEach((id, index) => insertDemoFollower.run(id, `-${index + 1} days`))

const demoNotifications = [
  [
    'demo-notification-01',
    'sample-zuri',
    'follow',
    'zuriliving followed you.',
    null,
    0,
    '-12 minutes'
  ],
  [
    'demo-notification-02',
    'sample-jay',
    'like',
    'buildwithjay liked your blug “Building Community One Reply at a Time”.',
    'seed-10',
    0,
    '-38 minutes'
  ],
  [
    'demo-notification-03',
    'sample-amina',
    'comment',
    'amina.football commented on “The Case for Walking Without Headphones”.',
    'seed-08',
    0,
    '-2 hours'
  ],
  [
    'demo-notification-04',
    'channel-history-ng',
    'follow',
    'history.nigeria followed you.',
    null,
    0,
    '-5 hours'
  ],
  [
    'demo-notification-05',
    'sample-nia',
    'bookmark',
    'niabooks saved your blug “How to Read More Without Making It a Chore”.',
    'seed-09',
    1,
    '-1 day'
  ],
  [
    'demo-notification-06',
    'sample-leo',
    'reply',
    'leowatches replied to your comment on “Why Your Creative Work Needs Boring Systems”.',
    'seed-06',
    1,
    '-2 days'
  ],
  [
    'demo-notification-07',
    'channel-super-eagles',
    'follow',
    'supereagles.archive followed you.',
    null,
    1,
    '-3 days'
  ],
  [
    'demo-notification-08',
    'sample-zuri',
    'share',
    'zuriliving shared your blug “Building Community One Reply at a Time”.',
    'seed-10',
    1,
    '-1 day'
  ],
  [
    'demo-notification-09',
    'channel-naija-music',
    'new_post',
    'Naija Music Archive published a new blug.',
    'music-roots',
    0,
    '-3 hours'
  ]
]
const insertDemoNotification = db.prepare(
  `INSERT OR IGNORE INTO notifications (id,user_id,actor_id,type,message,post_id,read,created_at) VALUES (?,'local-admin',?,?,?,?,?,datetime('now',?))`
)
demoNotifications.forEach((item) => insertDemoNotification.run(...item))

db.pragma('optimize')

export { dataDir, uploadsDir }
