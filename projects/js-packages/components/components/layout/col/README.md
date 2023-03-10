# Col

Primitive component to implement `Columns` in a Layout composition.

It needs to be wrapped by `Container`.

[ Storybook Reference ](https://automattic.github.io/jetpack-storybook/?path=/story/js-packages-components-layout--default)

## Usage

```jsx
import { Container, Col, Text } from '@automattic/jetpack-components';

<Container>
	<Col sm={2} md={4} lg={6}>
		<Text>Hello</Text>
		<Text>World!</Text>
	</Col>
</Container>
```

## Props

### className

A custom class to append with the default ones.

- Type: `String`
- Default: `undefined`
- Required: `false`

### sm

The number of columns that will be applied in small breakpoints, or you could force the column it starts and ends.

Max of `4` columns.

- Type: `Number`|`{start: Number, end: Number}`
- Default: `4`
- Required: `false`

#### Example

```jsx
<Col sm={ 3 }></Col>
<Col sm={ { start: 2, end: 4 } }></Col>
```

### md

The number of columns that will be applied in medium breakpoints, or you could force the column it starts and ends.

Max of `8` columns.

- Type: `Number`|`{start: Number, end: Number}`
- Default: `8`
- Required: `false`

#### Example

```jsx
<Col md={ 6 }></Col>
<Col md={ { start: 3, end: 5 } }></Col>
```

### lg

The number of columns will be applied in large breakpoints, or you could force where the column starts and ends.

Max of `12` columns.

- Type: `Number`|`{start: Number, end: Number}`
- Default: `12`
- Required: `false`

#### Example

```jsx
<Col lg={ 10 }></Col>
<Col lg={ { start: 4, end: 12 } }></Col>
```
