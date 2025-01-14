import { useBlockProps } from '@wordpress/block-editor';
import { Placeholder, TextControl } from '@wordpress/components';
import { View } from '@wordpress/primitives';

const IntegrationEdit = props => {
	const { attributes, setAttributes } = props;

	const blockProps = useBlockProps();

	return (
		<View { ...blockProps }>
			<Placeholder instructions="Enter the Zap Webhook" label="ZAPIER">
				<TextControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label="URL"
					onChange={ value => setAttributes( { url: value } ) }
					placeholder="https://hooks.zapier.com/hooks/catch/..."
					value={ attributes.url || '' }
					type="url"
				/>
			</Placeholder>
		</View>
	);
};

export default IntegrationEdit;
