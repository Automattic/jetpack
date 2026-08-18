# Verbum

A word, discourse, or reason; connoting an appeal to rational discourse.

Verbum is the comment UX for WordPress.com and Jetpack, and is the successor to Highlander Comments. It is built with [Preact](https://preactjs.com/) and bundled with [Webpack](https://webpack.js.org/), chosen to keep the bundle small and limit the impact on page performance metrics.

## Usage

Add the package as a dependency in your plugin's `composer.json`:

```json
"require": {
    "automattic/jetpack-verbum": "@dev"
}
```

Then initialize it:

```php
use Automattic\Jetpack\Verbum;

Verbum::init();
```

`Verbum::init()` registers everything: the front end comment form, the Discussion settings, wp-admin comment moderation, and the REST endpoints. It gates itself, so it is safe to call unconditionally: everything stays inert outside WordPress.com Simple, and the comment form additionally stays off for the Reader, GlotPress, wp-admin, P2, the support forums, and any blog with `enable_verbum_commenting` disabled.

### Migration switch

While Verbum is being extracted, `jetpack-mu-wpcom` still ships its own copy and loads that one by default. The `jetpack_verbum_rewrite` filter picks which copy runs:

```php
add_filter( 'jetpack_verbum_rewrite', '__return_true' );
```

It is read on `plugins_loaded` at priority 0, so the filter has to be added from a plugin or mu-plugin — a theme is too late. Only one copy loads either way. The filter goes away once the package owns Verbum outright.

## Architecture

### PHP (`src/`)

- **`Verbum`** — Package loader. Decides whether the comment experience should run and wires up everything else.
- **`Verbum\Comment_Form`** (`src/comment-form/`) — Replaces the core comment form, enqueues the app, and handles comments submitted through it.
- **`Verbum\Settings`** — The Verbum settings on the wp-admin Discussion screen.
- **`Verbum\Moderation`** (`src/moderation/`) — Block-aware comment editing in wp-admin.
- **`Verbum\Blocks\Utils`** — Sanitizing and parsing blocks in comment content.
- **`Verbum\Blocks\Editor`** — Loads the isolated block editor for comments.
- **`Verbum\Blocks\Editor_Assets`** — Loads the block editor assets from `widgets.wp.com`.
- **`Verbum\REST\Auth_Controller`** — `wpcom/v2/verbum/auth`, returns user info based on cookies/headers.
- **`Verbum\REST\OEmbed_Controller`** — `wpcom/v2/verbum/embed`, embed data for the embed block without requiring authentication.

### JavaScript

- **`src/comment-form/`** — The Preact app, alongside the PHP that renders and enqueues it. `index.tsx` is the entry point; `dynamic-loader.js` is the tiny script that boots it.
- **`src/moderation/moderation.js`** — Attaches the block editor to the comment edit screen in wp-admin.

## Technical details

### Basics

Because a Preact app manages the experience, we overwrite and remove the standard WordPress comment section hooks. Everything that is not needed is removed and the app is output in place of the submit button. That also means the default comment section settings — normally used to change button and heading wording or to inject custom components — are not honored. If something else overwrites the submit button, the entire comment form fails to load.

With block themes and the site editor, not every theme adds the comment section to the single-post template. Themes that do not add the comment form need the block added before Verbum will load.

### Dynamic loading

Verbum loads no scripts until the comment section is visible on screen. `src/comment-form/dynamic-loader.js` does this with `IntersectionObserver` and `WP_Enqueue_Dynamic_Script`. The main script is registered and dynamically enqueued rather than enqueued normally; when the form scrolls into view, `loadScript()` injects and runs it.

### Handling login

When a user logs in via WordPress.com or Facebook, a pop-up opens to the remote login URL (r-login.wordpress.com). Once authentication succeeds a `wpc_` cookie is added and the window closes. A nonce for posting a comment is created before the login, and logging in invalidates both it and the nonce in the logout URL. A small piece of JS in wpcom's `public.api/connect/index.php` updates the nonce in the hidden input and sets the new logout URL on the `VerbumComments` object.

### Jetpack

Sites with enhanced comments enabled on Jetpack also get Verbum. Rather than injecting the app, Jetpack adds an iframe to `jetpack.wordpress.com`, which loads it and handles everything from there. Because of that, functions like `get_current_blog_id()` cannot be trusted — they return details for `jetpack.wordpress.com`. Jetpack passes the relevant data through the GET request instead.

Most of the Jetpack logic lives in wpcom's `wp-content/mu-plugins/jetpack/class.jetpack-renderer.php`.

### Managing state

Global state is defined in `src/comment-form/state.tsx`, using the Preact [signals API](https://preactjs.com/guide/v10/signals/). New state belongs there, with a comment describing it.

Define a signal with `signal()`, passing the default value. Import it from the state file and read `signal.value` in a component; that creates a subscription which updates the component when the value changes. When a signal's value depends on other state, use `computed`:

```js
const todos = signal( [
	{ text: 'Buy groceries', completed: true },
	{ text: 'Walk the dog', completed: false },
] );

// Re-runs automatically whenever `todos` changes.
const completed = computed( () => todos.value.filter( todo => todo.completed ).length );
```

To run arbitrary code in response to signal changes, use `effect( fn )`. Like computed signals, effects track which signals they access and re-run when those change:

```js
const name = signal( 'Jane' );
const surname = signal( 'Doe' );
const fullName = computed( () => `${ name.value } ${ surname.value }` );

// Logs the name every time it changes.
const dispose = effect( () => console.log( fullName.value ) );

name.value = 'John'; // Logs: "John Doe"

dispose(); // Destroys the effect and its subscriptions.
```

To read a signal without subscribing to it, use `signal.peek()`.

## Development

The Verbum block editor is managed separately, in Calypso under [`packages/verbum-block-editor`](https://github.com/Automattic/wp-calypso/tree/trunk/packages/verbum-block-editor). Its changes deploy on their own and are imported into Verbum through the existing logic.

### Commands

Run these from this package's directory:

- `pnpm build` — Build the development bundle.
- `pnpm build-production` — Build the production bundle.
- `pnpm run watch` — Rebuild on file changes.
- `pnpm run e2e-tests` — Run the Playwright suite.

Build output lands in `build/`.

### Local development

Verbum only executes on WordPress.com Simple, so testing means syncing to a sandbox rather than running it locally. Build first, then sync, then sandbox the site you are testing.

- On Simple sites: sync the code to your sandbox and sandbox the site you are testing.
- On Atomic sites: sync the code to your sandbox and sandbox `jetpack.wordpress.com`, since that is where the iframe loads Verbum from.

More details for Simple site testing: PCYsg-Osp-p2#simple-testing. For WoA: PCYsg-Osp-p2#woa.

### After merge — deploy process

1. Create a Jetpack PR, review it, and merge.
2. To initiate a Simple Site deployment, follow PCYsg-Osp-p2#simple-deployment. The Jetpack release team (#jetpack-release) also runs a daily deployment for merged changes.
3. To initiate a WoA deployment, follow PCYsg-Osp-p2#woa-deployment. A new package version is released weekly otherwise.

### Testing

PHP unit tests run with `jp test php packages/verbum`.

The Playwright suite in `tests/e2e/` runs against real WordPress.com sites, not CI. Before running it:

1. Sandbox these sites:
	- jetpack.wordpress.com
	- e2esiteopencommentstoeveryone.wordpress.com
	- e2ecommentauthormustfilloutnameandemail.wordpress.com
	- e2eusersmustberegisteredandloggedintocomment.wordpress.com
2. Run `npx playwright install` to install the browsers.

Then run `pnpm run e2e-tests`. To watch the tests unfold, run `npx playwright test --ui --config tests/e2e/playwright.config.ts`.

### Where to track new Verbum issues

The relevant project board is at https://github.com/orgs/Automattic/projects/908/views/1.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Verbum is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
