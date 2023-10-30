import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import edit from './edit';
import save from './save';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	...metadata,
	edit,
	save,
	deprecated: [ deprecatedV2, deprecatedV1 ],
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/buttons' ],
				isMatch: ( _, block ) => {
					// core/buttons blocks contain one or more core/button block, it's these that
					// should be equivalent to a payment button but as the result of the transformation
					// must be of the same type as the block that defines the transformation, only one
					// can be transformed.
					// Detecting this is only possible from Gutenberg 11.5+ when the isMatch API was changed
					// to provide the block parameters.
					return (
						block !== undefined &&
						1 === block.innerBlocks.length &&
						'core/button' === block.innerBlocks[ 0 ].name
					);
				},
				transform: ( _, fromInnerBlocks ) => {
					const fromInnerBlock = fromInnerBlocks[ 0 ];
					const toButtonAttrs = {
						element: 'a',
						text: fromInnerBlock.attributes.text ?? '',
						className: fromInnerBlock.attributes.className ?? '',
					};

					const width = fromInnerBlock.attributes.width;
					if ( width ) {
						toButtonAttrs.width = width.toString() + '%';
					}

					// Map borderRadius from nnpx to nn.
					// core/button has a max button radius of 100, but jetpack/button has a max of 50
					// this relies upon jetpack/button enforcing it's maximum.
					const borderRadius = fromInnerBlock.attributes.style?.border?.radius;
					if ( borderRadius ) {
						toButtonAttrs.borderRadius = parseInt(
							borderRadius.substring( 0, borderRadius.length - 2 )
						);
					}

					const toJetpackButton = createBlock( 'jetpack/button', toButtonAttrs, [] );
					return createBlock( 'jetpack/' + name, {}, [ toJetpackButton ] );
				},
			},
		],
	},
} );
