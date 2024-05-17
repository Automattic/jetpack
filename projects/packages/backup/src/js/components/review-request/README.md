# Review request

Component designed to prompt for a plugin review after a successful event.

## Usage ( currently part of Backup components )

```jsx
import { ReviewRequest } from './review-request';
<ReviewRequest
	cta="Text action line requesting a review"
	onClick={ () => ... }
	requestReason="The motive for the one we are asking for a review"
	reviewText="Text related to the successful interaction"
/>
```

## Props

### cta

Text action line, recommending the next tier

- Type: `String`
- Default: `""`
- Required: `true`

### href

Link to the review page

- Type: `link`
- Default: `""`
- Required: `true`

### onClick

Callback that will be called when the user click/tap into the ReviewRequest

- Type: `Function`
- Default: `undefined`
- Required: `true`

### requestReason

Text indicating the reason for the one we are requesting a review.

- Type: `String`
- Default: `""`
- Required: `true`

### reviewText

A text giving context for a user related to the successful event.

- Type: `String`
- Default: `""`
- Required: `true`

### dismissedReview

Boolean indicating if the review has already been dismissed.

- Type: `Boolean`
- Default: `""`
- Required: `true`

### dismissMessage

Function to run whenever the dismiss button is clicked.

- Type: `Function`
- Default: `""`
- Required: `true`
