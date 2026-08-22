### README

## Local backend mode

1. Copy `.env.example` to `.env.local` if you want to change the preset login.
2. Run `npm run dev` to start the local API and web app.
3. Log in with `admin` / `blugbug-local` unless overridden locally.

SQLite is created at `data/blugbug.sqlite`; local database files are ignored by Git.

This document provides a simple guide on how to set up and run the web application.

### Prerequisites
- Node.js and npm installed
- Supabase account and project set up

### Installation

1. **Clone the Repository:**
   ```sh
   git clone https://github.com/your-username/chatter.git
   cd chatter
   ```

2. **Install Dependencies:**
   ```sh
   npm install
   ```

3. **Set Up Environment Variables:**
   - Create a `.env` file in the root directory from the `.env.example`:
     ```sh
     cp .env.example .env
     ```
   - Add your Supabase URL and key to the `.env` file:
     ```env
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_KEY=your-supabase-key
     ```

### Running the Application

1. **Start the Development Server:**
   ```sh
   npm run dev
   ```

2. **Open the Application:**
   - Open your browser and navigate to `http://localhost:5173`.

### Running Tests

1. **Start the Test Server:**
   ```sh
   npm run test:e2e:dev
   ```

2. **Open Cypress:**
   ```sh
   npx cypress open
   ```

3. **Run Tests:**
   - In the Cypress UI, select the test you want to run.

### Additional Information


---

**Blugbug** is a web application designed for bloggers who want to share their thoughts, interests, and valuable information while enjoying the interactive feel of social media. With Blugbug, not only can you write and share your blogs (blugs), but you can also engage directly with your readers. Commenting and replying is easy, and you can use the `@` symbol to mention users directly, notifying them that they've been mentioned in a blug.

Blugbug also offers a feature that allows you to follow other bluggers whose content you find interesting. The Blug tab on the homepage keeps you updated with posts from the people you follow. But that’s just the beginning! In your profile settings, you can select up to 5 interests. Once you do, the Blugspot tab on the homepage will start displaying blugs that match your selected interests.

The homepage offers even more features: 
- A search bar to find users.
- A "Top Liked" tab to see the most popular blugs on the platform.
- A "Bookmark" section to save blugs you want to read later.
- A "Latest Blug" section to keep you updated with the newest posts.

Beyond the homepage:
- The **MyBlug** tab lets you view, review, or delete your own blugs.
- The **BlugPage** allows you to browse all blugs on the platform, with an easy-to-use search bar.
- The **Profile Settings** page is where you can edit your name or bluggername, choose your interests, and much more.

Blugbug is your go-to platform for blogging with a social twist!

---
