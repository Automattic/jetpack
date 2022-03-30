/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { InnerBlocks } from '@wordpress/block-editor';
import v1Migration from '../v1';

export default {
	isEligible: ( oldAttributes, oldInnerBlocks ) => {
		// If the direct descendant of this block is a jetpack button, then it must be <= V3 block
		return (
			oldInnerBlocks.length &&
			oldInnerBlocks[ 0 ]?.name === 'jetpack/button' &&
			! v1Migration.isEligible( oldAttributes, oldInnerBlocks )
		);
	},
	save: ( { className } ) => (
		<div className={ className }>
			<InnerBlocks.Content />
		</div>
	),
	migrate: ( oldAttributes, oldInnerBlocks ) => {
		const { align, ...buttonAttributes } = oldAttributes;
		const newAttributes = {};
		if ( align ) {
			newAttributes.align = align;
		}

		const button = createBlock(
			'jetpack/recurring-payments-button',
			buttonAttributes,
			oldInnerBlocks
		);

		return [ newAttributes, [ button ] ];
	},
	attributes: {
		planId: {
			type: 'integer',
		},
		align: {
			type: 'string',
		},
		url: {
			type: 'string',
			// Used for blocks created without the payment form auto open feature.
			default: '#',
		},
		uniqueId: {
			type: 'string',
			// Used for blocks created without the payment form auto open feature.
			default: 'id',
		},
	},
};
