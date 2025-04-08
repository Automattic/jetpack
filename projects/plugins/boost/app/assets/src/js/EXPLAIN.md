
## Kebab Case

We are using kebab-case both in filenames and path names. Be careful with case sensitivity and committing to git. 


## React Component size

It's fine to have multiple components in a single file, but if the file is getting too big, it's better to split it into multiple components.


## Structure

### Top-Level Structure

```bash
/
	- index.ts # Public exports
	- lib/ # App-wide code
		- stores/ # App-wide stores
		- utils/ # Utility functions
	- features/ # Features
		- ui # generic, reusable components
			- back-button
			- ...
		- critical-css # critical-css related components
			- critical-css-meta # a component
				- critical-css-meta.tsx # the main react component
				- critical-css-meta.module.scss # styles related to this component
			- lib # Features have their own lib to keep it nice and clean
				- stores
					- critical-css-state.ts
					- ...
		- ...
	- pages/ # Pages (a.k.a. routes)
		- critical-css-advanced
			- critical-css-advanced.tsx # a component that represents a page in the UI.
		- purchase-success
			- purchase-success.tsx
		- p2
		- ...
	- layout/ # Global layout components
		- header
		- footer
		- wrapper
		- ...
```

* `index.tsx` and `main.tsx` - The entry files for the app. `main.tsx` has the router.
* `features/` - Most of the app's code goes here. Every feature should be placed in its own directory.
* `lib/` - Any generic code that is not directly tied to specific components.
	* `lib/stores/` - Some shared hooks.
* `pages/` - The pages of the app. Each page should be placed in its own directory.
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
