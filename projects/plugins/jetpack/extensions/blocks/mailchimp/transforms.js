import { createBlock } from '@wordpress/blocks';

export default {
	to: [
		{
			type: 'block',
			blocks: [ 'jetpack/subscriptions' ],
			transform: () => createBlock( 'jetpack/subscriptions' ),
		},
	],
};
