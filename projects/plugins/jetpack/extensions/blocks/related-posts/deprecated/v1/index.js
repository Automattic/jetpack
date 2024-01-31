import { createBlock } from '@wordpress/blocks';

export { default as attributes } from './attributes';
export { default as supports } from './supports';

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
