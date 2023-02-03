import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const FORM_BLOCK_NAME = 'jetpack/contact-form';

export const FORM_STYLE = {
	ANIMATED: 'animated',
	BELOW: 'below',
	DEFAULT: 'default',
	OUTLINED: 'outlined',
};

export const useFormWrapper = ( { attributes, clientId, name } ) => {
	const BUTTON_BLOCK_NAME = 'jetpack/button';
	const SUBMIT_BUTTON_ATTR = {
		text: __( 'Submit', 'jetpack-forms' ),
		element: 'button',
		lock: { remove: true },
	};

	const { replaceBlock } = useDispatch( blockEditorStore );

	const parents = useSelect( select => {
		return select( blockEditorStore ).getBlockParentsByBlockName( clientId, FORM_BLOCK_NAME );
	} );

	useEffect( () => {
		if ( ! parents?.length ) {
			replaceBlock(
				clientId,
				createBlock( FORM_BLOCK_NAME, {}, [
					createBlock( name, attributes ),
					createBlock( BUTTON_BLOCK_NAME, SUBMIT_BUTTON_ATTR ),
				] )
			);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );
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
