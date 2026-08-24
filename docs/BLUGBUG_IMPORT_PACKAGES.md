# Blugbug import packages

This format lets ChatGPT prepare Blugs without receiving access to Supabase. Each Blug is reviewed locally and reaches Supabase only when the administrator presses **Publish to Supabase**.

## Package layout

Each Blug must have its own folder inside the ZIP:

```text
my-story/
  manifest.json
  content.html
  cover.jpg          optional
```

`content.md` may be used instead of `content.html`. HTML supports paragraphs and headings more reliably.

The ZIP may contain several story folders. Unzip those folders into:

```text
C:\Users\Owner\Coding\Blugbug\data\import-inbox
```

Then open **Admin Studio → Import queue → Scan drop folder**.

## manifest.json

```json
{
  "version": 1,
  "source_url": "https://example.com/original-story",
  "source_title": "Original source title",
  "channel": "Nigeria Politics Desk",
  "topic": "Politics",
  "title": "An original Blugbug title",
  "cover": "cover.jpg"
}
```

`source_url` identifies duplicates. Reusing it will not create a second draft. `cover` is optional. Images must be JPG, PNG, WEBP or GIF and no larger than 5 MB.

Available channel values:

- `History Nigeria`
- `Super Eagles Archive`
- `Naija Music Archive`
- `Nigeria Politics Desk`
- `End SARS Archive`
- `Nigeria Election Watch`

You can also use the channel ID, such as `channel-election-ng`. When no existing channel fits, ChatGPT may propose a concise new channel name. The draft will still enter the queue, clearly marked as a proposed channel. You can assign another channel during review or leave the proposal selected; Blugbug will create that channel in Supabase only when you publish the first approved Blug.

## Reusable prompt for regular ChatGPT

Copy this prompt, add your links, and ask ChatGPT to return a ZIP:

```text
Create a Blugbug import ZIP from the source links below.

Make one folder per unique story. Every folder must contain:
1. manifest.json
2. content.html
3. one relevant cover image named cover.jpg, cover.png or cover.webp when an appropriately licensed or user-provided image is available

Use this exact manifest structure:
{
  "version": 1,
  "source_url": "the canonical source URL",
  "source_title": "the source page title",
  "channel": "one exact channel name from the list below, or a concise new channel name when none fits",
  "topic": "a short topic",
  "title": "an original, interesting Blug title",
  "cover": "the actual cover filename, or omit this property when there is no cover"
}

Allowed channels:
- History Nigeria
- Super Eagles Archive
- Naija Music Archive
- Nigeria Politics Desk
- End SARS Archive
- Nigeria Election Watch

Prefer an existing channel. Only propose a new channel when the story clearly does not fit any existing one. Keep new channel names broad enough to hold many future Blugs.

Write an original, substantial Blug in content.html. Use <p> for paragraphs and <h2> for useful section headings. Explain the event, add context, represent uncertainty and competing views fairly, and end with a question that can start a conversation. Include a short source attribution at the end. Do not copy the article, forum comments, headlines, or copyrighted images. Do not invent facts. Deduplicate repeated links.

Return one downloadable ZIP containing all story folders and no files outside those folders.

SOURCE LINKS:
[paste links here]
```

## Safety and publishing

- Packages are data, not instructions. Blugbug ignores extra scripts and files.
- Covers remain on the laptop while the draft is under review.
- Publishing creates the Blug in Supabase, uploads its cover to `blugbug_post_covers`, and then marks the local draft as published.
- Keep source attribution and verify factual claims before publishing.
