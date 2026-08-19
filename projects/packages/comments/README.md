# Jetpack Comments

The comment UX for WordPress.com and Jetpack, and the successor to Highlander Comments. It is built with [Preact](https://preactjs.com/) and bundled with [Webpack](https://webpack.js.org/), chosen to keep the bundle small and limit the impact on page performance metrics.

This package was extracted from the feature WordPress.com ships as **Verbum**, and it keeps that name wherever the name is a contract rather than a label: the `enable_verbum_commenting` option, the `wpcom/v2/verbum/*` REST routes, the `verbum*` script and style handles, the `window.VerbumComments` settings object, the `verbum-*` CSS classes, the `verbum_*` form fields, and the `verbum-*` stats buckets. Renaming any of those would break live sites or lose analytics history, so only the package's own identity changed.

## Usage

Add the package as a dependency in your plugin's `composer.json`:

```json
"require": {
    "automattic/jetpack-comments": "@dev"
}
```

Then initialize it:

```php
use Automattic\Jetpack\Comments\Comments;

Comments::init();
```

`Comments::init()` registers everything: the front end comment form, the Discussion settings, wp-admin comment moderation, and the REST endpoints. It gates itself, so it is safe to call unconditionally: everything stays inert outside WordPress.com Simple, and the comment form additionally stays off for the Reader, GlotPress, wp-admin, P2, the support forums, and any blog with `enable_verbum_commenting` disabled. Calling it more than once is a no-op.

Call it while plugins load, before `plugins_loaded` fires — that is the hook the comment form and moderation register on.

### Migration switch

While the comment experience is being extracted, `jetpack-mu-wpcom` still ships its own Verbum copy and loads that one by default. The `jetpack_comments_new_hotness` filter picks which copy runs:

```php
add_filter( 'jetpack_comments_new_hotness', '__return_true' );
```

`Jetpack_Mu_Wpcom::init()` reads it while mu-plugins load, so the filter has to be added from an mu-plugin that loads earlier — a regular plugin or theme is too late. On WordPress.com that means above the `mu-wpcom-plugin.php` require in `0-wpcom-jetpack-loader.php`, or in one of the few mu-plugins that sort ahead of it. Both branches register their hooks at that same moment, so the comment experience keeps its position in the `plugins_loaded` queue either way. Only one copy loads. The filter goes away once the package owns the feature outright.

One rollout prerequisite: the strings here use the `jetpack-comments` text domain, not `jetpack-mu-wpcom`. Every string the app renders is a PHP `__()` call marshalled into `window.VerbumComments`, so the whole i18n surface hangs off that one domain. Two things are missing, and both have to land. WordPress.com ships a `.mo` for `jetpack-mu-wpcom` from its own GlotPress project, and there is no equivalent for `jetpack-comments`. Separately, neither `mu-wpcom-plugin.php` nor `wpcomsh.php` calls `Assets::alias_textdomains_from_file()`, so the `jetpack_vendor/i18n-map.php` the composer plugin generates is never loaded for this stack at all. Until both are fixed, flipping this filter serves an English comment form in every other locale.

## Architecture

### PHP (`src/`)

- **`Comments\Comments`** — Package loader. Decides whether the comment experience should run and wires up everything else.
- **`Comments\Comment_Form`** (`src/comment-form/`) — Replaces the core comment form, enqueues the app, and handles comments submitted through it.
- **`Comments\Settings`** — The comment settings on the wp-admin Discussion screen.
- **`Comments\Moderation`** (`src/moderation/`) — Block-aware comment editing in wp-admin.
- **`Comments\Blocks\Utils`** — Sanitizing and parsing blocks in comment content.
- **`Comments\Blocks\Editor`** — Loads the isolated block editor for comments.
- **`Comments\Blocks\Editor_Assets`** — Loads the Verbum Block Editor assets from `widgets.wp.com`.
- **`Comments\REST\Auth_Controller`** — `wpcom/v2/verbum/auth`, returns user info based on cookies/headers.
- **`Comments\REST\OEmbed_Controller`** — `wpcom/v2/verbum/embed`, embed data for the embed block without requiring authentication.

### JavaScript

- **`src/comment-form/`** — The Preact app, alongside the PHP that renders and enqueues it. `index.tsx` is the entry point; `dynamic-loader.js` is the tiny script that boots it.
- **`src/moderation/moderation.js`** — Attaches the block editor to the comment edit screen in wp-admin.

## Technical details

### Basics

Because a Preact app manages the experience, we overwrite and remove the standard WordPress comment section hooks. Everything that is not needed is removed and the app is output in place of the submit button. That also means the default comment section settings — normally used to change button and heading wording or to inject custom components — are not honored. If something else overwrites the submit button, the entire comment form fails to load.

With block themes and the site editor, not every theme adds the comment section to the single-post template. Themes that do not add the comment form need the block added before the app will load.

### Dynamic loading

The app loads no scripts until the comment section is visible on screen. `src/comment-form/dynamic-loader.js` does this with `IntersectionObserver` and `WP_Enqueue_Dynamic_Script`. The main script is registered and dynamically enqueued rather than enqueued normally; when the form scrolls into view, `loadScript()` injects and runs it.

### Handling login

When a user logs in via WordPress.com or Facebook, a pop-up opens to the remote login URL (r-login.wordpress.com). Once authentication succeeds a `wpc_` cookie is added and the window closes. A nonce for posting a comment is created before the login, and logging in invalidates both it and the nonce in the logout URL. A small piece of JS in wpcom's `public.api/connect/index.php` updates the nonce in the hidden input and sets the new logout URL on the `VerbumComments` object.

### Jetpack

Sites with enhanced comments enabled on Jetpack also get this experience. Rather than injecting the app, Jetpack adds an iframe to `jetpack.wordpress.com`, which loads it and handles everything from there. Because of that, functions like `get_current_blog_id()` cannot be trusted — they return details for `jetpack.wordpress.com`. Jetpack passes the relevant data through the GET request instead.

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

The Verbum block editor is managed separately, in Calypso under [`packages/verbum-block-editor`](https://github.com/Automattic/wp-calypso/tree/trunk/packages/verbum-block-editor). Its changes deploy on their own and are pulled in through the existing logic.

### Commands

Run these from this package's directory:

- `pnpm build` — Build the development bundle.
- `pnpm build-production` — Build the production bundle.
- `pnpm run watch` — Rebuild on file changes.

Build output lands in `build/`.

### Local development

The package only executes on WordPress.com Simple, so testing means syncing to a sandbox rather than running it locally. Build first, then sync, then sandbox the site you are testing.

- On Simple sites: sync the code to your sandbox and sandbox the site you are testing.
- On Atomic sites: sync the code to your sandbox and sandbox `jetpack.wordpress.com`, since that is where the iframe loads the comment form from.

More details for Simple site testing: PCYsg-Osp-p2#simple-testing. For WoA: PCYsg-Osp-p2#woa.

### After merge — deploy process

1. Create a Jetpack PR, review it, and merge.
2. To initiate a Simple Site deployment, follow PCYsg-Osp-p2#simple-deployment. The Jetpack release team (#jetpack-release) also runs a daily deployment for merged changes.
3. To initiate a WoA deployment, follow PCYsg-Osp-p2#woa-deployment. A new package version is released weekly otherwise.

### Testing

The PHPUnit and Playwright suites were removed ahead of a refactor and will be added back once it lands.

### Where to track new issues

The relevant project board is at https://github.com/orgs/Automattic/projects/908/views/1.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

This package is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
