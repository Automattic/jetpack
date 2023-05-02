# Pricing Utils

This is a helper folder that contains util functions related to pricing (e.g. Intro Offers) and can be extended to include other methods.

## Usage

### isFirstMonthTrial

```jsx
import { isFirstMonthTrial } from '@automattic/jetpack-components';
isFirstMonthTrial( introOffer );
```

#### introOffer (required)

An Intro Offer object returned by the API. It must contain an `interval_unit` and `interval_count` for the function to check if it's a first month trial or not. It returns `true` if `interval_unit` is `'month'` **and** `interval_count` is `1`, all other combinations return `false`.
