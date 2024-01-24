# Verbum Comments

A word, discourse, or reason; connoting an appeal to rational discourse.

## Description

Verbum is the comment UX for WordPress.com and Jetpack and is the successor to [Highlander Comments](../highlander-comments/highlander-comments.php). It is built with [Preact](https://preactjs.com/) and uses [Vite](https://vitejs.dev/) for bundling. This was chosen to limit the size of the bundle and minimize impact on the page performance metrics.

## Technical Details

### Basics

Page performance impact was highly considered in this plugin. For that reason Preact was chosen to minimize the bundle size as the basic ReactDOM modules needed for rendering were very large. Preact is best utilized with Vite which compiles and bundles everything into the `dist` directory.

From a developer experience it functions the same as React with Webpack. You can use all the typical npm scripts like `start`, `build`, and `lint`.

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

Verbum is built and managed from this repository, but is then deployed to WPCOM inside `wp-content/mu-plugins/verbum`. To keep these both in sync it is important to deploy your changes to WPCOM after merging any changes. Here is the workflow you can use.

### Commands

**In order for Verbum to sync properly to your sandbox you need to have `wpcom` set as a host in your SSH config pointed to your sandbox**

* `npm run build` - Build Verbum.
* `npm run build:sync` - Build Verbum and sync to sandbox.
* `npm run start` - Build and watch Verbum.
* `npm run start:sync` - Build and watch Verbum, while syncing to sandbox.
* `npm run lint` - Look for lint issues.
* `npm run lint:fix` - Look for lint issues and fix easily fixable issues.
* `npm run build:editor` - Build the editor app inside `/editor`, necessary when changing the editor files.

### After Merge - Deploy process

Since this is not deployed to WPCOM automatically you need to manually deploy your changes with the following steps:

1. `git checkout trunk && git reset --hard && git clean -fd` - After your merge make sure you have the freshest version on trunk.
2. `git checkout trunk && git reset --hard && git clean -fd` - Log in to your sandbox and do the same thing.
3. `npm run build:editor && npm run build:sync` - From Verbum run the sync command to move the latest version of Verbum to your sandbox. You can also use only `npm run build:sync` for non editor changes (it will be faster for Intel CPUs)
4. `arc diff --only` - From your sandbox create a new diff for WordPress.com
5. Your changes should have already been tested on WordPress.com before merging but check for smoke and failing test.
6. If there are any LINT issues or errors when deploying please be sure to update the REPO as well to avoid future breaking.
7. `arc land` - Land your changes
8. `deploy wpcom` - Deploy and done!

### Testing

#### Setup

1. Please sandbox the following sites before running the tests
    - jetpack.wordpress.com
    - e2esiteopencommentstoeveryone.wordpress.com
    - e2ecommentauthormustfilloutnameandemail.wordpress.com
    - e2eusersmustberegisteredandloggedintocomment.wordpress.com

2. Run `npx playwright install` to install the browser.
3. Run `npm i` to install the pre-push git hook. 

Now the tests will run on every push.

The tests live in /tests folder. To run them, you can run `npm run e2e-tests`.

If you want to watch the tests unfold, you can run `npx playwright test --ui`.
