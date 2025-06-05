import { store as blockEditorStore } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { FORM_BLOCK_NAME, FORM_STYLE } from '../util/constants';
import getBlockStyle from '../util/get-block-style';

const useFormStyle = clientId => {
	const formBlockAttributes = useSelect( select => {
		const [ formBlockClientId ] = select( blockEditorStore ).getBlockParentsByBlockName(
			clientId,
			FORM_BLOCK_NAME
		);

		return select( blockEditorStore ).getBlockAttributes( formBlockClientId );
	} );

	return getBlockStyle( formBlockAttributes?.className ) || FORM_STYLE.DEFAULT;
};

export default useFormStyle;
