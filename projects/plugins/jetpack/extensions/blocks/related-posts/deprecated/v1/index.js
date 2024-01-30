import { createBlock } from '@wordpress/blocks';

export { default as attributes } from './attributes';

export const migrate = ( attrs, innerBlocks ) => {
	return [
		attrs,
		[
			createBlock( 'core/heading', {
				content: attrs.headline,
				level: 3,
			} ),
			...innerBlocks,
		],
	];
};

export const save = () => null;
