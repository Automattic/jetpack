/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import save from './save';
import { DialogueIcon as icon } from '../../shared/icons';

/**
 * Style dependencies
 */
import './style.scss';

export const name = 'dialogue';
export const title = __( 'Dialogue', 'jetpack' );
export const settings = {
	title,
	description: __( 'Dialogue', 'jetpack' ),
	icon,
	category: 'layout',
	supports: {
		'align': true,
	},
	edit,
	save,
	attributes,
	usesContext: [
		'jetpack/conversation-speakers',
		'jetpack/transcription-showtimestamp',
	],
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					const innerBlock = createBlock( 'core/paragraph', {
						content,
					} );

					return createBlock( 'jetpack/dialogue', {}, [ innerBlock ] );
				},
			},
		],
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( attrs, innerBlocks ) => {
					const { speaker, color, showTimeStamp, timeStamp } = attrs;
					const innerBlock = innerBlocks[ 0 ]; // we expceted only one block.

					const inlineStyles = color ? ` style="color: ${ color }` : '';
					const content = `<span${ inlineStyles }>${ speaker }</span>` +
						( showTimeStamp ? `(${ timeStamp })` : '' ) +
						': ' +
						innerBlock.attributes.content;

					return createBlock( 'core/paragraph', {
						content,
					} );
				},
			},
		],
	},
};
