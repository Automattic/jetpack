/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

export const transformToCoreGroup = innerBlocks => {
	const subscriberViewContent = innerBlocks.find(
		block => 'premium-content/subscriber-view' === block.name
	);

	return createBlock( 'core/group', {}, subscriberViewContent.innerBlocks );
};
