import { createBlock } from '@wordpress/blocks';
import INNER_BLOCKS_DEPRECATION from '../shared/deprecations/inner-blocks-deprecation.js';
import save from './save.js';

export default [
	{
		...INNER_BLOCKS_DEPRECATION,
		attributes: {
			...INNER_BLOCKS_DEPRECATION.attributes,
			showCountrySelector: {
				type: 'boolean',
			},
			default: {
				type: 'string',
			},
			onChangeDefaultCountry: {
				type: 'function',
			},
		},
		apiVersion: 3,
		migrate: ( attributes, innerBlocks ) => {
			const newAttributes = {
				...attributes,
				showCountrySelector: false,
			};
			let labelAttributes = {};
			if ( innerBlocks.length > 0 ) {
				const label = innerBlocks.find( block => block.name === 'jetpack/label' );
				labelAttributes = label.attributes;
			}
			const newInnerBlocks = [
				createBlock( 'jetpack/label', { ...labelAttributes } ),
				createBlock( 'jetpack/phone-input', {} ),
			];
			return [ newAttributes, newInnerBlocks ];
		},
		isEligible: ( attributes, innerBlocks ) => {
			const inputBlock = innerBlocks.find( block => block.name === 'jetpack/input' );
			return (
				attributes.showCountrySelector === undefined ||
				Boolean( inputBlock && inputBlock.attributes && inputBlock.attributes.type === 'tel' )
			);
		},
		save,
	},
	{
		...INNER_BLOCKS_DEPRECATION,
		attributes: {
			...INNER_BLOCKS_DEPRECATION.attributes,
			label: { type: 'string', default: 'Phone' },
		},
	},
];
