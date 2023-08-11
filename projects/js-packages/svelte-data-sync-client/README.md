# Data Sync Client for Svelte

This package is intended to be used together with the [`@jetpack/packages/wp-js-data-sync`](https://github.com/Automattic/jetpack/blob/trunk/projects/packages/wp-js-data-sync/) package.

The Data Sync Client for Svelte creates Type-safe [Svelte stores](https://svelte.dev/docs#run-time-svelte-store) that automatically sync with WordPress via the REST API and preload values using `wp_localize_script`.

## Usage

### Step 1: Initialize the Client

First, you need to initialize the client, for example in `options.ts` file, this is going to create a namespaced factory that you can use to create stores:

```ts
// favorites.ts
import { initializeClient } from '@automattic/jetpack-svelte-data-sync-client';
const client = initializeClient('jetpack_favorites');
```

### Step 2: Setup type safe stores:

[Zod](https://zod.dev) is used to ensure that the values are properly typed and match the expectations.

**Important Zod methods**:
Zod is a flexible library that helps validate values at run-time.

This gives you a lot of flexibility setting up the types, depending on how they're used and how they should be handled when something goes wrong.

Here are a couple important Zod methods to know about:

- [z.optional](https://github.com/colinhacks/zod#optional) - This is used to mark a field as optional, but it will still be validated if it's present.
- [z.default](https://github.com/colinhacks/zod#default) - This is used to set a default value for a field if it's undefined, but will not override a value if it's already set, even if the type doesn't match.
- [z.catch](https://github.com/colinhacks/zod#catch) - This is used to catch errors and return a default value if the type doesn't match.
- [z.passthrough](https://github.com/colinhacks/zod#passthrough) - By default Zod object schemas strip out unrecognized keys during parsing. Using `passthrough` will allow unrecognized keys to be passed through.

```ts
import { z } from 'zod';

// favorites.ts
const favorite_post_schema = z.object({
	id: z.number(),
	title: z.string(),
});

export const favorites = {
	enabled: client.createAsyncStore('favorite_posts_enabled', z.boolean().catch(false)),
	posts: client.createAsyncStore('favorite_posts', z.array(favorite_post_schema).catch([])),
};
```

That's it, now you can use `favorites.enabled` and `favorites.posts` in your Svelte components.

#### Step 3: Store Usage

Use `client.createAsyncStore()` to create an object with two Svelte stores:

- `store`: Use this as a normal Svelte store. When the value is updated, it will dispatch POST requests to the REST API endpoint.
- `pending`: In case you need to display a loading state, this store will be `true` while the value is being updated.

Here's a simple example of how that would work:

```svelte
<script type="ts">
	import { favorites } from "./favorites.ts";
	const enabled = favorites.enabled.store;
	const pending = favorites.enabled.pending;
</script>

{#if $pending}
	 🌊 I'm updating the value
{/if}

<label for="favorite-posts-enabled">
	<input type="checkbox" bind:checked={$enabled} />
	Enable
</label>
```

#### Interacting with REST API

Every created Data Sync Client Store will also have an `.endpoints` property that can be used to interact with the REST API endpoints directly if needed (for example, to refresh a value).

```ts
// favorites.ts
const result = await favorites.enabled.endpoints.GET();
const result = await favorites.enabled.endpoints.POST(true);
```

Note that the endpoint methods are type-safe too, so you can't pass a value that doesn't match the schema. If you do, errors will be thrown.

If you need to interact with the REST API endpoints directly, you can use the [API](./src/API.ts) class directly:

```ts
const api = new API();
// API Must be initialized with a nonce, otherwise WordPress REST API will return a 403 error.
api.initialize('jetpack_favorites', window.jetpack_favorites.rest_api.nonce);

// Send a request to any endpoint:
const result = await api.request('GET', 'foobar', '<endpoint-nonce>');
```

To dive in deeper, have a look at [API](./src/API.ts) and [Endpoint](./src/Endpoint.ts) source files.

#### Putting it all together

Here's all the boilerplate code to get you started quickly:

```ts
// favorites.ts
import { z } from 'zod';
import { initializeClient } from '@automattic/jetpack-svelte-data-sync-client';

const client = initializeClient('jetpack_favorites');

const favorite_post_schema = z.object({
	ID: z.number(),
	post_title: z.string(),
});

export const favorites = {
	enabled: client.createAsyncStore('enabled', z.boolean().catch(false)),
	posts: client.createAsyncStore('posts', z.array(favorite_post_schema),
};
```

And use the stores in Svelte.

```svelte
<div class="posts">
	<h1>Posts</h1>
	{#each $posts as post}
		<h1>{post.post_title} ({post.ID})</h1>
	{/each}
</div>
```

### Error Handling

Values are synced with the REST API asynchronously and Synced Store is going to attempt to automatically retry 3 times before giving up and reverting the UI value to the last known value.

After 3 attempts have failed, Synced Store will [add the error to the error store](https://github.com/Automattic/jetpack/blob/981d325c76ceaa4e46ee00751307850d8b0bb947/projects/js-packages/svelte-data-sync-client/src/SyncedStore.ts#L136-L146).

The error store can be used to display an error message to the user.

You can view the available properties of the error object in the [SyncedStoreError](./src/types.ts#L46) type.

```svelte
<script>
	const posts = client.createAsyncStore('posts', z.array(favorite_post_schema));
	const errors = posts.errors;
</script>

{#if $errors.length > 0}
	{@const error = $errors[0]}
	<div class="error">
		<h1>Error</h1>
		<p>{error.message}</p>
	</div>
{/if}
```

#### Global Error Store

`initializeClient()` also returns a global error store that can be used to display errors from all stores.

It uses `derived()` under the hood, so it will only update when the error store of any of the stores changes.

For example, assuming

```svelte
<script>
	// Import the client that was setup using `initializeClient()`
	import { favoritesClient } from './favorites.ts'
	const globalErrors = favoritesClient.globalErrorStore();
</script>

<div class="error-area">
	{#if $globalErrors.length > 0}
		{#each $globalErrors as error}
			<div class="error">
				<h1>Error</h1>
				<p>{error.message}</p>
			</div>
		{/each}
	{/if}
</div>
```

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Svelte Data Sync Client is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
