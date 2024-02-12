# Verbum Comments

A word, discourse, or reason; connoting an appeal to rational discourse.

## Description

Verbum is the comment UX for WordPress.com and Jetpack and is the successor to [Highlander Comments](../highlander-comments/highlander-comments.php). It is built with [Preact](https://preactjs.com/) and uses [Webpack](https://webpack.js.org/) for bundling. This was chosen to limit the size of the bundle and minimize impact on the page performance metrics.

## Technical Details

### Basics

Page performance impact was highly considered in this plugin. For that reason Preact was chosen to minimize the bundle size as the basic ReactDOM modules needed for rendering were very large.

Because we are using a Preact based plugin to manage the user experience, we overwrite and remove any of the basic WordPress comment section hooks. We remove everything that is not needed and output our plugin in place of the submit button. This also means that we do not utilize any of the default settings for the comment section that would allow others to overwrite them. These are typically used to change the wording on buttons and headings or inject your own custom components. If someone were to selfishly overwrite the submit button it would prevent the entire comment form from loading.

With the introduction of block based themes and the site editor, not all themes come with the comment section added to the single-post template. If the template does not add the comment form they will need to add the block in order for Verbum to load.

### Dynamic Loading

Verbum does not load any scripts until the comment section is visible on the screen. This is done from [dynamic-loader](./dynamic-loader.js) using `IntersectionObserver` and [`WP_Enqueue_Dynamic_Script`](../wp-enqueue-dynamic-script.php). In the index.php the main script (dist/index.js) for the plugin is registered and dynamically enqueued rather than enqueuing as normal. Then when we decide we are ready to load we call the `loadScript()` method to inject and run the script.

### Handling Login

When the user chooses to log in via WordPress.com or Facebook, a separate pop-up is opened to the remote login url (r-login.wordpress.com). After the user succeeds in authenticating a `wpc_` cookie is added and the window is closed. Before the login, a nonce token is created for posting a comment. Once the user successfully logs in, that nonce is no longer valid as well as the logout URL which includes a nonce. To capture this new nonce, there is a tiny bit of JS that exists in `public.api/connect/index.php` that updates the nonce in the hidden input field and sets the new logout URL in the VerbumComments object.

### Jetpack

Currently when a user has enhanced comments enabled on Jetpack they will also get Verbum Comments on their site. Rather than injecting the plugin, Jetpack adds an iframe to `jetpack.wordpress.com` where the plugin is loaded and handles everything from there. Because of this we cannot use typical functions like `get_current_blog_id()` because in Jetpack we will retrieve the details for `jetpack.wordpress.com`. Jetpack passes all the relevant data through the GET request so it can be retrieved from there if needed.

Most of the Jetpack logic can be found in `wp-content/mu-plugins/jetpack/class.jetpack-renderer.php`

### Managing State
Our global state is defined in state.jsx. Whenever we need to define new state it should be done there, with the appropriate comment to describe it. We use preact [signal api](https://preactjs.com/guide/v10/signals/) to do this. 

You can define a signal with the `signal()` function which takes the default value of the state as argument. To access it, import it from the state file and use `signal.value` in your components. This creates a subscription which will automatically update your components when the signal's value has changed. 

When a signal's value depends on other pieces of the global state you can use the `computed` function.
```js
const todos = signal([
  { text: "Buy groceries", completed: true },
  { text: "Walk the dog", completed: false },
]);

// create a signal computed from other signals
const completed = computed(() => {
  // When `todos` changes, this re-runs automatically:
  return todos.value.filter(todo => todo.completed).length;
});

```
To run arbitrary code in response to signal changes, we can use effect(fn). Similar to computed signals, effects track which signals are accessed and re-run their callback when those signals change.
```js
const name = signal("Jane");
const surname = signal("Doe");
const fullName = computed(() => `${name.value} ${surname.value}`);

// Logs name every time it changes:
effect(() => console.log(fullName.value));
// Logs: "Jane Doe"

// Updating `name` updates `fullName`, which triggers the effect again:
name.value = "John";
// Logs: "John Doe"
```
You can destroy an effect and unsubscribe from all signals it accessed by calling the returned function.
```js
const dispose = effect(() => console.log(fullName.value));
// Logs: "Jane Doe"

// Destroy effect and subscriptions:
dispose();

```
In case you want to use the signal's value without subscribing to it, use signal.peek().
```js
const delta = signal(0);

const count = signal(0);

effect(() => {
// Update `count` without subscribing to `count`:
count.value = count.peek() + delta.value;
});
```

## Development

Verbum is built and managed inside the `jetpack-mu-wpcom` package developed in the Jetpack Monorepo. Changes for Verbum will specifically made in the `projects/packages/jetpack-mu-wpcom/src/features/verbum-comments` directory. The Verbum block editor is now managed in Calypso under `packages/verbum-block-editor`[https://github.com/Automattic/wp-calypso/tree/trunk/packages/verbum-block-editor]. Changes for the block editor will be deployed separately and will be automatically imported in Verbum through our existing logic.

### Commands

Note: These commands should be ran from `/jetpack-mu-wpcom` root directory.

* `pnpm build-js` - Build Verbum development code.
* `pnpm build-production-js` - Build Verbum production code.
* `pnpm lint` - Check for lint issues in the code.
* `pnpm run watch` - Watch file changes
* `jetpack rsync mu-wpcom-plugin` - Sync local files to development environment. This command tool will ask you for the remote destination after your input it in the command line. Ensure the remote path is correct depending on the environment you're targetting. If you're targetting your sandbox, the remote destination should look like this: `USERNAME@HOSTNAME:~/public_html/wp-content/mu-plugins/jetpack-plugin/production`. You will also need to add `define( 'JETPACK_AUTOLOAD_DEV', true );` to mu-plugins/0-sandbox.php. More details for Simple site testing: [PCYsg-Osp-p2#simple-testing]. If you're targetting your WoA site, the remote destination should look like this: `mywoadevsite.wordpress.com@sftp.wp.com:htdocs/wp-content/plugins/jetpack-mu-wpcom-plugin-dev`. More details for WoA testing: [PCYsg-Osp-p2#woa]. 

In most cases you will only need to sync the code to your sandbox, since Verbum is loaded through a Simple Site in all scenarios. There may be a case where you want to confirm that your PHP changes are not negatively impacting WoA sites (for example, checking for any errors/warning on wp-admin pages). In this case, you will want to sync the code directly to your WoA using the steps above.

### Local Development:

To test your changes, you will first need to build the Verbum code using one of the build commands above and sync the changes to your development environment. The build commands will clean the `jetpack-mu-wpcom/src/build` directory and output the newly bundled files (`/build/verbum-comments`). One method to quickly sync and test changes is to use the `jetpack rsync mu-wpcom-plugin` command. After syncing the files, make sure that you sandbox your testing site to see your latest changes.

Reminder:

On Simple Sites: Sync the Verbum code changes to your sandbox and sandbox the site your testing.
On Atomic Sites: Sync the Verbum code changes to your sandbox and sandbox `jetpack.wordpress.com`.

### After Merge - Deploy process

1. Create a Jetpack PR, review it, and merge.
2. To initiate a Simple Site deployment, follow these instructions: [PCYsg-Osp-p2#simple-deployment]. The Jetpack release team (#jetpack-release) will also do a daily deployment for any merged changes, if you do not initiate a manual deployment.
3. To initate a WoA deployment, follow these instructions: [PCYsg-Osp-p2#woa-deployment]. A new version of `jetpack-mu-wpcom` will be released weekly, if you do not initiate a manual deployment.

### Testing

#### Setup

1. Please sandbox the following sites before running the tests
	- jetpack.wordpress.com
	- e2esiteopencommentstoeveryone.wordpress.com
	- e2ecommentauthormustfilloutnameandemail.wordpress.com
	- e2eusersmustberegisteredandloggedintocomment.wordpress.com

2. Run `npx playwright install` to install the browsers needed.

The tests live in /tests folder. To run them, you can run `pnpm run e2e-tests`.

If you want to watch the tests unfold, you can run `npx playwright test --ui --config src/features/verbum-comments/playwright.config.ts`.

### Where to track new Verbum Issues

If you stumble upon any issues or have any suggestions for possible changes to Verbum, you can find the relevant project board here: https://github.com/orgs/Automattic/projects/908/views/1.

