# Local Testing Setup — Jetpack Search AI Answers

A checklist to verify your local environment can run tests and test the AI Answers feature end-to-end, including live calls to a WPcom sandbox.

---

## 1. Prerequisites

- [x ] Docker Desktop is installed and running (`docker info` returns no error)
- [x ] `jetpack` CLI is installed and on PATH:
  ```bash
  jetpack --version
  # If missing: npm install -g @automattic/jetpack-cli  (or pnpm add -g)
  ```
- [x ] Node and pnpm are available:
  ```bash
  node --version   # 20+
  pnpm --version   # 9+
  ```
- [x ] PHP and Composer are available:
  ```bash
  php --version    # 8.0+
  composer --version
  ```
- [x ] You're on the right branch:
  ```bash
  git branch       # should be jps3-answers-plan
  ```

---

## 2. Install Monorepo Dependencies

- [x ] Install all JS and PHP dependencies from the monorepo root:
  ```bash
  pnpm install
  composer install
  ```
  This only needs to be done once (or after a `git pull` that changes lockfiles).

---

## 3. Run Unit Tests Without Docker

The PHP unit tests for the Search and Sync packages use WorDBless (no WordPress needed) and run locally without Docker.

- [x ] Run Search package PHP tests:
  ```bash
  jetpack test php packages/search -v
  ```
  Expected: all tests pass (including `AI_Answers_Test` once Task 1 is implemented).

- [x ] Run Sync package PHP tests:
  ```bash
  jetpack test php packages/sync -v
  ```
  Expected: all tests pass (including the CPT sync tests once Task 2 is implemented).

- [x ] Run Search package JS tests:
  ```bash
  cd projects/packages/search
  pnpm test-scripts
  ```
  Expected: all tests pass.

---

## 4. Build the Search Package

Build is required before the Docker site can serve the updated JS bundle.

- [x ] Build all Search JS bundles:
  ```bash
  cd projects/packages/search
  pnpm build
  ```
  Expected: `build/` directory updated with no errors.

- [ ] For active development, use watch mode instead:
  ```bash
  pnpm watch
  ```
  Leave this running while you work — it rebuilds on file save.

---

## 5. Start Docker WordPress Environment

- [x ] Start containers (first time or after `jetpack docker clean`):
  ```bash
  jetpack docker up -d
  jetpack docker install
  ```
  WordPress is now at [http://localhost](http://localhost).  
  Default credentials: `jp_docker_acct` / `jp_docker_pass`

- [x ] If containers were already installed previously, just start them:
  ```bash
  jetpack docker up -d
  ```

- [x ] Verify WordPress is reachable:
  ```bash
  open http://localhost/wp-admin
  ```
  You should see the WP login page.

- [x ] Verify Jetpack plugin is active (it's auto-linked from the monorepo):
  ```bash
  jetpack docker wp plugin list | grep jetpack
  ```
  Expected: `jetpack` shows as `active`.

---

## 6. Connect Jetpack to WordPress.com via Tunnel

Jetpack requires a publicly accessible URL to handshake with WPcom.

**If you're an Automattician**, use Jurassic Tube (preferred):

- [ ] Follow the setup instructions at PCYsg-GJ2-p2 to install and configure Jurassic Tube if you haven't already.
- [ ] Start the tunnel:
  ```bash
  jetpack docker up --jurassic-tube
  ```
  Note your assigned domain (e.g. `yourname.jurassictube.example`).

**Alternative**: Use ngrok (requires a paid account for a stable subdomain):
- [ ] Start with ngrok:
  ```bash
  jetpack docker up --ngrok
  ```

- [ ] Once the tunnel is running, re-install WordPress with the tunnel domain:
  ```bash
  jetpack docker install
  ```
  (This updates `WP_SITEURL` and `WP_HOME` to the tunnel domain.)

- [ ] Go to **Jetpack → Dashboard** in wp-admin and complete the WPcom connection flow. Sign in with your WPcom account.

- [ ] Verify connection:
  ```bash
  jetpack docker wp jetpack status
  ```
  Expected: `Jetpack is connected to WordPress.com`.

---

## 7. Enable Instant Search

Instant Search must be enabled for the overlay and AI Answers panel to appear.

- [ ] Enable the Search module and Instant Search:
  ```bash
  jetpack docker wp option update jetpack_active_modules '["search"]' --format=json
  jetpack docker wp option update instant_search_enabled 1
  ```

- [ ] Verify in wp-admin: **Jetpack → Search** should show the Search dashboard with "Instant Search" toggled on.

---

## 8. Enable the AI Answers Feature Flag

- [ ] Enable the AI Answers feature:
  ```bash
  jetpack docker wp option update jetpack_search_ai_answers_enabled 1
  ```

- [ ] Verify the **Behavior** and **Topics** tabs appear at **Jetpack → Search**.

- [ ] Add a test behavior post via the Behavior tab (type any text, click Save).

- [ ] Add a test topic via **Jetpack → Search → Topics → Add Topic**.
  Use this post content as a starting point:
  ```
  This topic covers questions about resetting passwords and account access.

  Example questions:
  - How do I reset my password?
  - I forgot my login email.
  - My account is locked.

  Guidelines:
  Direct users to the account recovery page. Do not speculate about lock durations.
  ```

---

## 9. Point PHP→WPcom Calls to a Sandbox

This routes Jetpack's server-side API calls (JWT issuance, sync, REST proxy) through your WPcom sandbox instead of production.

- [ ] Create a mu-plugin file for sandbox config:
  ```bash
  cat > tools/docker/mu-plugins/sandbox.php << 'EOF'
  <?php
  // Route Jetpack server-side WPcom calls to sandbox.
  // Replace YOUR_SANDBOX with your actual sandbox hostname (e.g. myname.wordpress.com).
  define( 'JETPACK__SANDBOX_DOMAIN', 'YOUR_SANDBOX.wordpress.com' );
  EOF
  ```

- [ ] Restart containers to pick up the mu-plugin:
  ```bash
  jetpack docker down && jetpack docker up -d
  ```

- [ ] Verify the sandbox constant is loaded:
  ```bash
  jetpack docker wp eval "echo JETPACK__SANDBOX_DOMAIN;"
  ```
  Expected: prints your sandbox hostname.

**What this affects**: sync calls, JWT token issuance, REST proxy calls made by PHP. It does NOT redirect browser-to-wpcom calls (the overlay search query and the AI answers SSE call).

---

## 10. Point Browser→WPcom Calls to a Sandbox

The instant-search overlay and AI Answers SSE call go directly from the browser to `public-api.wordpress.com`. To test against a sandbox, you need to intercept these at the network level.

### Option A: Proxyman (macOS, recommended)

- [ ] Install [Proxyman](https://proxyman.io) (free tier is sufficient).
- [ ] Enable SSL proxying for `public-api.wordpress.com`.
- [ ] Add a **Map Remote** rule:
  - Match: `https://public-api.wordpress.com/*`
  - Replace host with: `YOUR_SANDBOX.wordpress.com`
- [ ] Enable the rule and keep Proxyman running while testing.

### Option B: /etc/hosts entry (only works if sandbox has a stable IP)

- [ ] Add to `/etc/hosts`:
  ```
  SANDBOX_IP  public-api.wordpress.com
  ```
- [ ] Flush DNS cache:
  ```bash
  sudo dscacheutil -flushcache && sudo killall -HUP mDNSResponder
  ```
- [ ] Remove the entry when done to restore normal operation.

### Option C: Hardcode in mu-plugin (no proxy needed, test only)

If you just want to test with a different base URL, add an override filter in your sandbox mu-plugin. The search overlay reads `JetpackInstantSearchOptions.apiRoot` for WP REST calls; for the AI answers endpoint you can override via a filter on `generate_initial_javascript_state()`:

```php
add_filter( 'jetpack_instant_search_options', function( $options ) {
    // Override the AI answers endpoint base for sandbox testing.
    $options['aiAnswersBaseUrl'] = 'https://YOUR_SANDBOX.wordpress.com/wpcom/v2';
    return $options;
} );
```

This requires a small code change in `answers-panel`'s SSE URL construction to read `aiAnswersBaseUrl` from `JetpackInstantSearchOptions` with a fallback to `https://public-api.wordpress.com/wpcom/v2`. Add that fallback when implementing Task 8.

---

## 11. Verify End-to-End in the Browser

Once the wpcom AI agent endpoint is live on your sandbox:

- [ ] Open the site frontend in a browser (via the tunnel URL or localhost).
- [ ] Click the Search icon or start typing in the search box to open the overlay.
- [ ] Type a query that matches your test topic (e.g. "reset password") — at least 3 characters.
- [ ] Verify: **loading spinner** appears above the results ("Finding an answer…").
- [ ] Verify: **streamed tokens** appear and the answer text builds up progressively.
- [ ] Verify: **citations** appear below the answer when the stream completes.
- [ ] Verify: standard search results still appear below the citations.
- [ ] Type a query with no matching topic or search results — verify the panel shows a graceful "I couldn't find relevant content" response (or hides silently on error).
- [ ] Disable the feature flag and verify the panel disappears:
  ```bash
  jetpack docker wp option update jetpack_search_ai_answers_enabled 0
  ```
  Refresh the page — no AI panel should appear.

---

## 12. Verify Sync is Wiring Up (Optional — requires WPcom sandbox)

To verify that CPT posts are reaching the sandbox's shadow replicastore:

- [ ] Create a topic post via the Topics tab.
- [ ] Force a sync:
  ```bash
  jetpack docker wp jetpack sync start
  ```
- [ ] Check sync queue is draining:
  ```bash
  jetpack docker wp jetpack sync status
  ```
- [ ] On your WPcom sandbox, use the Jetpack Debug page (`jptools.wordpress.com/debug`) or the WPcom REST API to verify the `jetpack_search_topic` post arrived.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `jetpack docker up` fails | Make sure Docker Desktop is running and you have at least 4 GB RAM allocated |
| Jetpack won't connect | Confirm the tunnel is active and the tunnel URL matches `WP_SITEURL` — run `jetpack docker install` after starting the tunnel |
| Instant Search overlay doesn't appear | Check `instant_search_enabled` is `1` and the Jetpack Search module is active; try a hard refresh |
| AI panel doesn't appear | Check `jetpack_search_ai_answers_enabled` is `1`; open browser dev tools and look for console errors from the SSE connection |
| SSE call returns 404 | The wpcom agent isn't deployed yet on that sandbox — confirm with the WPcom side implementation |
| SSE call returns 401 | HMAC token not generating — check `jetpack_search_ai_answers_enabled` is `1` and the blog token is present (`jetpack docker wp eval "print_r(Automattic\Jetpack\Connection\Tokens::get_access_token(JETPACK_MASTER_USER));"`) |
| Sync tests fail | Run `jetpack test php packages/sync -v` and check the error message; common cause is a missing WorDBless bootstrap |
