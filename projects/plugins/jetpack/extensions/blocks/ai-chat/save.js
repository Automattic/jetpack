import { useBlockProps } from '@wordpress/block-editor';
import { DEFAULT_ASK_BUTTON_LABEL } from './constants';

export default function ( { attributes } ) {
	const blockProps = useBlockProps.save( {
		'data-ask-button-label': attributes.askButtonLabel || DEFAULT_ASK_BUTTON_LABEL,
	} );
	return <div { ...blockProps } />;
}
