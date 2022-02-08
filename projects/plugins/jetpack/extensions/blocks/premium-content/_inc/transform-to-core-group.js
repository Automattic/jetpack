/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';

export const transformToCoreGroup = innerBlocks => {
	const subscriberViewContent = innerBlocks.find(
		block => 'premium-content/subscriber-view' === block.name
	);

	if (
		1 === subscriberViewContent.innerBlocks.length &&
		'core/group' === subscriberViewContent.innerBlocks[ 0 ].name
	) {
		return subscriberViewContent.innerBlocks[ 0 ];
	}

	return createBlock( 'core/group', {}, subscriberViewContent.innerBlocks );
};
