import { useBlockProps } from '@wordpress/block-editor';

export default function ( { attributes } ) {
	const blockProps = useBlockProps.save( {
		'data-ask-button-label': attributes.askButtonLabel,
	} );
	return <div { ...blockProps } />;
}
