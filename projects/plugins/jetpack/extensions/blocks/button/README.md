# Button Block

`Button` is an inner block to be used to render a button element that lets users take actions with a single click or tap.

## Usage

```jsx
function BlockEdit() {
	return (
		<div>
			<InnerBlocks
				template={ [ [ 'jetpack/button', { element: 'button', text: 'Submit' } ] ] }
				templateLock="all"
			/>
		</div>
	);
}
```

## Supports

- **HTML**: no.
- **Inserter**: no. The block can only be used as an inner block of another block.
- **Alignment**: `left`, `right`.
- **Styles**: `fill` (default), and `outline`.

## Attributes

The Button block accepts the following attributes:

### element

The rendered element. Can be a simple link (`a`), a button of type submit (`button`), or an input of type submit (`input`).

- Type: `string`
- Validation: `enum: [ 'a', 'button', 'input' ]`

### saveInPostContent

Whether the Button will be saved in the post content, or server-side rendered in PHP.<br />
Due to the stricter WordPress.com sanitization rules, when `saveInPostContent` is enabled, the block will always render as a simple link (`a`).

- Type: `boolean`
- Default: `false`

### uniqueId

A unique ID that will be passed to the rendered element as both `id` and `data-id-attr` HTML attributes.<br />
Useful for targeting the element with CSS or JS, or to be replaced in PHP.

- Type: `string`

### passthroughAttributes

A map of "Button attributes" - "parent attributes" to keep specified Button attributes in sync with its **immediate** parent's block attributes.<br />
The parent attributes are checked using`getBlockRootClientId` [See docs](https://developer.wordpress.org/block-editor/reference-guides/data/data-core-block-editor/#getBlockRootClientId).
The sync is one-way: changing the parent attribute value will update the Button attribute, while the opposite won't work.

- Type: `object`

#### Example

A parent block might have a `link` attribute to be also used for the Button href.

```jsx
<InnerBlocks
	template={ [ [ 'jetpack/button', {
		element: 'a',
		text: 'Submit',
		passthroughAttributes: {
			url: 'link', // buttonAttribute: 'parentAttribute'
		},
	} ] ] }
	templateLock="all"
/>
```

This way, the Button `url` will be automatically updated whenever the parent block `link` changes.

### text

The Button inner text.<br />
It can contain HTML, except when the Button is rendered as an `input`. In that case the HTML content will be stripped.

- Type: `string`

### placeholder

Text to be rendered in the editor, when the `text` is empty.

- Type: `string`
- Default: `"Add text…"`

### url

A URL that can be used as `href` HTML attribute when the Button is rendered as a simple link (`a`).

- Type: `string`

### textColor

The Button text color, from the theme color palette.

- Type: `string`

### customTextColor

The Button custom text color hex code.

- Type: `string`

### backgroundColor

The Button background color, from the theme color palette.

- Type: `string`

### customBackgroundColor

The Button custom background color hex code.

- Type: `string`

### gradient

The Button background gradient, from the theme gradient palette.

- Type: `string`

### customGradient

The Button custom CSS background gradient.

- Type: `string`

### borderRadius

The Button border radius.

- Type: `number`
