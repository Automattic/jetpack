# Review request

Component designed to prompt for a plugin review after a successful event.

## Usage

```jsx
import { ReviewRequest } from '@automattic/jetpack-components';

<ReviewRequest
	description="Related to the successful event"
	cta="Text action line requesting a review"
	onClick={ () => ... }
/>
```

## Props

### description

A text giving context for a user related to the successful event".

- Type: `String`
- Default: `""`
- Required: `true`

### cta

Text action line, recommending the next tier

- Type: `String`
- Default: `""`
- Required: `true`

### onClick

Callback that will be called when the user click/tap into the ReviewRequest

- Type: `Function`
- Default: `undefined`
- Required: `true`