import { createBlock } from '@wordpress/blocks';
import attributes from './attributes';
import supports from './supports';

const migrate = ( attrs, innerBlocks ) => {
	return [
		attrs,
		attrs.headline
			? [
					createBlock( 'core/heading', {
						content: attrs.headline,
						level: 3,
					} ),
					...innerBlocks,
			  ]
			: innerBlocks,
	];
};

export default {
	attributes,
	migrate,
	supports,
	save: () => null,
};
