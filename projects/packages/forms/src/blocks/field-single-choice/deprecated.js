import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import INNER_BLOCKS_DEPRECATION from '../shared/deprecations/inner-blocks-deprecation';
import migrateInnerOptionBlocks from '../shared/deprecations/migrate-inner-option-blocks';
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
