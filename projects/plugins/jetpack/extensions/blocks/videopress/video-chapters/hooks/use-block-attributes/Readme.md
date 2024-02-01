# useBlockAttributes

React custom hook to handle block attributes.

```jsx
import { TextControl } from '@wordpress/components';
import useBlockAttributes from './use-block-attributes';

function BlockTitleControl() {
	const { attributes, setAttributes } = useBlockAttributes();

	const { title } = attributes;

	return (
		<TextControl
			label="title"
			value={ title }
			onChange={ newTitle => setAttributes( { title: newTitle } ) }
		/>
	);
}
```