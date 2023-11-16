
## Kebab Case
In Svelte, files were named using Pascal case.

As we migrate to React, we should migrate to Kebab case both in filenames and path names. Careful with case-sensitivity and committing to git.


## React Component size

It's fine to have multiple components in a single file, but if the file is getting too big, it's better to split it into multiple components.


## Structure

### Top-Level Structure

```bash
/
	- index.ts # Public exports
	- Main.svelte # The main component
	- lib/ # App-wide code
		- stores/ # App-wide stores
		- utils/ # Utility functions
	- features/ # Features
		- ui # generic, reusable components
			- back-button
		- critical-css
			- index.ts
			- CriticalCssMeta.svelte
			- lib # Features have their own lib to keep it nice and clean
				- stores
					- critical-css-state.ts
					- ...
		- ...
	- pages/ # Pages (a.k.a. routes)
		- critical-css-advanced
			- CriticalCssAdvanced.svelte
		- purchase-success
			- purchase-success.tsx # react is kebab case now
		- p2, etc.
	- layout/ # Global layout components
		- header
		- footer
		- wrapper, etc.
```

* `Main.svelte` and `index.ts` - The entry files for the app. `index.ts` is compiled into `/assets/dist/jetpack-boost.js`
* `features/` - Most of the app's code goes here. Every feature should be placed in it's own directory.
* `lib/` - Any code that's not Svelte or React. This includes utility functions, constants, stores, etc.
	* `lib/stores/` - DataSync stores and their derivatives. In React this is probably going to be replaced with `lib/hooks`.
* `pages/` - The pages of the app. Each page should be placed in it's own directory.
* `layout/` - Global layout components. These are components that are used in multiple pages, such as the header, footer, etc.

### Feature Structure

Every feature can be either a simple component like `my-feature/my-feature.tsx` or advanced and include multiple related files and logic, for example:

**This sort of mirrors the top-level structure.**

```bash
/my-feature/
	- index.ts # Public exports
	- my-feature.tsx # The main component
	- my-feature.modules.scss # CSS modules
	- my-feature.stories.tsx # Storybook stories
	- ui # Tiny little components that are only used in this feature
		- /my-feature-button
			- my-feature-button.tsx
			- my-feature-input.tsx
	- lib/ # Feature-specific code
		- some-utility.ts # Utility functions for this feature
		- stores # Stores for this feature
			- some-store.ts
```



### Private & Public interfaces

// TODO
