import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

const FORM_BLOCK_NAME = 'jetpack/contact-form';

export const FORM_STYLE = {
	ANIMATED: 'animated',
	BELOW: 'below',
	DEFAULT: 'default',
	OUTLINED: 'outlined',
};

export const getBlockStyle = className => {
	const styleClass = className && className.match( /is-style-([^\s]+)/i );
	return styleClass ? styleClass[ 1 ] : '';
};

export const useFormStyle = clientId => {
	const formBlockAttributes = useSelect( select => {
		const [ formBlockClientId ] = select( blockEditorStore ).getBlockParentsByBlockName(
			clientId,
			FORM_BLOCK_NAME
		);

		return select( blockEditorStore ).getBlockAttributes( formBlockClientId );
	} );

	return getBlockStyle( formBlockAttributes?.className ) || FORM_STYLE.DEFAULT;
};
