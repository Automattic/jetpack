# InlineExpand

This component is used to slide down a inline block with text or elements. When it's rendered, it displays a clickable link. When it's clicked the block slides down. When clicked again, it slides up.

#### Usage

```js
var InlineExpand = require( 'components/inline-expand' );

render: function() {
	return (
		<InlineExpand label={ __( 'More options' ) }>
			// elements
		</InlineExpand>
	);
}
```

#### Properties

- `label` — The title of the card. If it's not present but `module` attribute is, it will fetch the module and use its name property as title.
- `onOpen`/`onClose` - Pass functions that will be executed when the block is revealed/concealed respectively.

```js
<InlineExpand
	label={ __( 'More options' ) }
	onOpen={ () => {
		// do something
	} }
>
	// elements
</InlineExpand>
```

- `icon` - To show an icon, pass an icon name like 'chevron-down'. Check list in \_inc/client/components/gridicon.
