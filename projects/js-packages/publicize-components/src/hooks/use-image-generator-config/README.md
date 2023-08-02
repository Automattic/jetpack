# useImageGeneratorConfig() hook

React hooks to deal with image generator config. It allows you to get options related to the image generator, as well as updating them.

```es6
import { TextControl } from '@wordpress/components';
import useImageGeneratorConfig from './hooks/use-image-generator-config';

function ImageGeneratorConfig() {
	const { customText, updateSettings } = useImageGeneratorConfig();

	const onTextChange = useCallback( ( newValue ) => {
		updateSettings( { customText: newValue } )
	}, [
		batchUpdateSettings,
	] );

	return (
		<TextControl
			value={ customText }
			onChange={ onTextChange }
			label={ __( 'Custom Text', 'jetpack' ) }
		/>
	);
}
```
