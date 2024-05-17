import { createBlock } from '@wordpress/blocks';

export const transformToCoreGroup = innerBlocks => {
	const subscriberViewContent = innerBlocks.find(
		block => 'premium-content/subscriber-view' === block.name
	);

	// If the Subscriber view contains only a core/group as a direct child, we'll return the block directly.
	// Needed to avoid having a group in a group each time when we transform a group to Premium content and back to group.
	if (
		1 === subscriberViewContent.innerBlocks.length &&
		'core/group' === subscriberViewContent.innerBlocks[ 0 ].name
	) {
		return subscriberViewContent.innerBlocks[ 0 ];
	}

	return createBlock( 'core/group', {}, subscriberViewContent.innerBlocks );
};
