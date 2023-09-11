# useBreakpointMatch

Utility to match against breakpoints.

[ Storybook Reference ](https://automattic.github.io/jetpack-storybook/?path=/story/js-packages-components-layout--breakpoint-match)

## Usage

```jsx
import { useBreakpointMatch } from '@automattic/jetpack-components';
const [ isLg ] = useBreakpointMatch('lg')
return isLg && <Component />
```

## Parameters

### breakpointToMatch

Single or Array of breakpoints to match against.

- Type: `String`|`Array<String>`
- Required: `true`

```javascript
useBreakpointMatch('lg');
useBreakpointMatch([ 'lg', 'sm' ]);
```

### operator

A Single or Array of operators to match less, equal, or greater than the breakpoint.

In Array, it matches against the same index from breakpoint.

- Type: `String`|`Array<String>`
- Required: `false`

#### Example

```javascript
useBreakpointMatch('md', '<=');
useBreakpointMatch([ 'lg', 'sm' ], ['<', '>']);
```
