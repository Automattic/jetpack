import { createBlock } from '@wordpress/blocks';
import supports from './supports';

export { default as attributes } from './attributes';

export const migrate = ( attrs, innerBlocks ) => {
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

export const save = () => null;

export default {
	supports,
};
