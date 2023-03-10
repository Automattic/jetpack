= ThemeProvider

ThemeProvider is a React component that, at the moment, defines and sets CSS variables to a wrapper element to make them accessible by the children components.
Usually, you'd like to provide the styles by wrappig your App component:

```jsx
import { ThemeProvider } from '@automattic/jetpack-components';

function MyComponent() {
	return (
		<ThemeProvider>
			<div style={ { color: var( --jp-green ) } }>Jetpack</div>
		</ThemeProvider>
	);
}
```

Unlike other more complex implementations that use React context to share data, the CSS vars are defined in the DOM element, and consequently, propagated to child DOM elements.

## API

### Children

ReactNode children to be wrapped by the ThemeProvider element.

### targetDom

Optional target DOM element to set the styles. By default, they are set in a new wrapper element created by the provider.
But when targetDom is defined, the styles are set straight into the given target, thus, the wrapper is not created.

When defining it, it's up to you the proper target to store the styles.

The following example stores the styles at the top of the page, in the body.

```jsx
import { ThemeProvider } from '@automattic/jetpack-components';

function MyComponent() {
	return (
		<ThemeProvider targetDom={ document.body }>
			<div style={ { color: var( --jp-green ) } }>Jetpack</div>
		</ThemeProvider>
	);
}
```

### id

Pass an id to register the ThemeProvider instance to avoid redefining the styles every time that a ThemeProvider instance is created, avoiding unneeded redefinitions of the styles.