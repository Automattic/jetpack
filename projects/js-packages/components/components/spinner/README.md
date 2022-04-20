# Spinner (DEPRECATED)

## We encourage to use [core Spinner](https://github.com/WordPress/gutenberg/tree/trunk/packages/components/src/spinner#readme) component instead
---------

Spinner is a React component for rendering a loading indicator.

## Usage

```jsx
import React from 'react';
import Spinner from '@automattic/jetpack-components';

export default class extends React.Component {
	render() {
		return <Spinner />;
	}
}
```

## Props

The following props can be passed to the Spinner component:

| PROPERTY  | TYPE     | REQUIRED | DEFAULT   | DESCRIPTION                                     |
| --------- | -------- | -------- | --------- | ----------------------------------------------- |
| **size**  | _number_ | no       | `20`      | The width and height of the spinner, in pixels. |
| **color** | _strong_ | no       | `#000000` | The color of the spinner, in hex.               |
