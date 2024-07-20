/**
 * Internal dependencies
 */
import { getBlockContent } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import features from '../features/index.js';

// Map of types to the corresponding AI Assistant request type.
const requestTypeMap = {
	'complex-words': 'breve-complex-word',
	'unconfident-words': 'breve-unconfident-word',
	'long-sentences': 'breve-long-sentence',
};

export const getRequestMessages = ( { feature, target, text, blockId, occurrence } ) => {
	const block = select( 'core/block-editor' ).getBlock( blockId );
	const html = getBlockContent( block );
	const dictionary = features?.find?.( ftr => ftr.config.name === feature )?.dictionary || {};
	const replacement = dictionary[ target.toLowerCase() ] || null;

	return [
		{
			role: 'jetpack-ai' as const,
			context: {
				type: requestTypeMap[ feature ],
				target,
				text,
				html,
				replacement,
				occurrence,
			},
		},
	];
};
