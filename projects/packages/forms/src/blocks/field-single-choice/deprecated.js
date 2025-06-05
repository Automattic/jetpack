import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import INNER_BLOCKS_DEPRECATION from '../shared/deprecations/inner-blocks-deprecation';
import migrateInnerOptionBlocks from '../shared/deprecations/migrate-inner-option-blocks';
import migrateOptionsToInnerBlocks from '../shared/deprecations/migrate-options-to-inner-blocks';
import multiFieldV1 from '../shared/deprecations/multiple-choice-field-deprecation';

const v1 = multiFieldV1( 'radio' );
const v2 = {
	attributes: {
		...INNER_BLOCKS_DEPRECATION.attributes,
		label: {
			type: 'string',
			default: __( 'Choose one option', 'jetpack-forms' ),
		},
	},
	supports: INNER_BLOCKS_DEPRECATION.supports,
	migrate( attributes, innerBlocks ) {
		/**
		 * When there are no inner blocks, the InnerBlocks.content in this version's
		 * save function is effectively the same as the original (v1) version's
		 * save function i.e. () => null.
		 *
		 * As isEligible is only used when the block's save function is valid, this
		 * deprecation will actually match before v1. The deprecation's will need
		 * to remain separate for the occasions where a v2 version of the block
		 * actually has inner blocks.
		 *
		 * Given this can match on both the v1 and v2 saved markup, it will need to
		 * handle migrating both scenarios.
		 */
		if ( ! innerBlocks?.length && attributes.options?.length ) {
			return migrateOptionsToInnerBlocks( attributes, 'checkbox' );
		}

		return migrateInnerOptionBlocks( attributes, innerBlocks, 'radio' );
	},
	save() {
		return <InnerBlocks.Content />;
	},
};
const v3 = {
	...INNER_BLOCKS_DEPRECATION,
	attributes: {
		...INNER_BLOCKS_DEPRECATION.attributes,
		label: {
			type: 'string',
			default: 'Choose one option',
		},
	},
	isEligible( _attributes, innerBlocks ) {
		if ( innerBlocks.length !== 2 ) {
			return true;
		}

		return innerBlocks.some(
			block => block.name !== `jetpack/label` && block.name !== `jetpack/options`
		);
	},
	migrate( attributes, innerBlocks ) {
		return migrateInnerOptionBlocks( attributes, innerBlocks, 'radio' );
	},
	save() {
		return (
			<div { ...useBlockProps.save() }>
				<InnerBlocks.Content />
			</div>
		);
	},
};

export default [ v3, v2, v1 ];
