# Container

Primitive component to be the [ `Grid Container` ](https://www.w3schools.com/css/css_grid_container.asp) in a Layout composition.

It's made to be used with `Col` as children.

[ Storybook Reference ](https://automattic.github.io/jetpack-storybook/?path=/story/js-packages-components-layout--default)

## Usage

```jsx
import { Container, Col, Button } from '@automattic/jetpack-components';

<Container>
	<Col>
		<Button>Click me!</Button>
	</Col>
</Container>
```

## Props

### className

An custom class to append with the default ones.

- Type: `String`
- Default: `undefined`
- Required: `false`

### fluid

Makes the container take the full width, and removes the right and left padding.

- Type: `Boolean`
- Default: `false`
- Required: `false`

#### Example

```jsx
<Container fluid />
```

### horizontalSpacing

The space on top and bottom of the container.

Value is mutiplied per `8px`, following our specs.

- Type: `Number`
- Default: `1`
- Required: `false`

#### Example

```jsx
// Space will be 16px
<Container horizontalSpacing={ 2 } />
```

### horizontalGap

The space between each row.

Value is mutiplied per `8px`, following our specs.

- Type: `Number`
- Default: `1`
- Required: `false`

#### Example

```jsx
// Space will be 24px
<Container horizontalGap={ 3 } />
```
