# Contextual Upgrade Trigger

The CUT component is designed to push users to upgrade from a Free plan to a Paid one, or from lower tier paid plans to higher ones.

**Design Specs for Contextual Upgrade Trigger:** PbJqbW-5k-p2

[ Storybook Reference ](https://automattic.github.io/jetpack-storybook/?path=/story/js-packages-components-contextual-upgrade-trigger--default)

## Usage

```jsx
import { ContextualUpgradeTrigger } from '@automattic/jetpack-components';

<ContextualUpgradeTrigger
	description="Current status of the product"
	cta="Text action line, recommending the next tier"
	onClick={ () => ... }
/>
```

To use as a link:

```jsx
import { ContextualUpgradeTrigger } from '@automattic/jetpack-components';

<ContextualUpgradeTrigger
	description="Current status of the product"
	cta="Text action line, recommending the next tier"
	href="https://jetpack.com"
/>
```

## Props

### className

A custom class to append with the default ones.

- Type: `String`
- Default: `undefined`
- Required: `false`

### description

A text giving context for a user about the current status of the product (i.e., how many updates per day).

- Type: `String`
- Default: `""`
- Required: `true`

### cta

Text action line, recommending the next tier

- Type: `String`
- Default: `""`
- Required: `true`

### onClick

Callback that will be called when the user click/tap into the CUT

- Type: `Function`
- Default: `undefined`
- Required: `false`

### href

URL to link to

- Type: `String`
- Default: `undefined`
- Required: `false`

### openInNewTab

Indicate if the link should open in a new tab

- Type: `Boolean`
- Default: `false`
- Required: `false`
