import { useSelect } from '@wordpress/data';
import { first } from 'lodash';

export const useParentAttributes = clientId =>
	useSelect( select => {
		const blockEditor = select( 'core/block-editor' );

		return blockEditor.getBlockAttributes( first( blockEditor.getBlockParents( clientId, true ) ) );
	} );
