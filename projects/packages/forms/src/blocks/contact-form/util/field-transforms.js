import { createBlock } from '@wordpress/blocks';
import { filter, isEmpty, map, startsWith } from 'lodash';

export default {
	to: [
		{
			type: 'block',
			blocks: [ 'jetpack/field-number' ],
			transform: attributes => createBlock( 'jetpack/field-number', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-text' ],
			transform: attributes => createBlock( 'jetpack/field-text', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-name' ],
			transform: attributes => createBlock( 'jetpack/field-name', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-email' ],
			transform: attributes => createBlock( 'jetpack/field-email', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-url' ],
			transform: attributes => createBlock( 'jetpack/field-url', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-date' ],
			transform: attributes => createBlock( 'jetpack/field-date', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-telephone' ],
			transform: attributes => createBlock( 'jetpack/field-telephone', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-textarea' ],
			transform: attributes => createBlock( 'jetpack/field-textarea', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-checkbox-multiple' ],
			transform: ( attributes, innerBlocks ) => {
				let newInnerBlocks = [];

				if ( ! isEmpty( innerBlocks ) ) {
					const optionBlocks = filter( innerBlocks, ( { name } ) =>
						startsWith( name, 'jetpack/field-option' )
					);

					newInnerBlocks = map( optionBlocks, block =>
						createBlock( 'jetpack/field-option-checkbox', {
							label: block.attributes.label,
							fieldType: 'checkbox',
						} )
					);
				} else if ( attributes.options?.length ) {
					newInnerBlocks = map( attributes.options, option =>
						createBlock( 'jetpack/field-option-checkbox', {
							label: option,
							fieldType: 'checkbox',
						} )
					);
				}

				return createBlock( 'jetpack/field-checkbox-multiple', attributes, newInnerBlocks );
			},
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-radio' ],
			transform: ( attributes, innerBlocks ) => {
				let newInnerBlocks = [];

				if ( ! isEmpty( innerBlocks ) ) {
					const optionBlocks = filter( innerBlocks, ( { name } ) =>
						startsWith( name, 'jetpack/field-option' )
					);

					newInnerBlocks = map( optionBlocks, block =>
						createBlock( 'jetpack/field-option-radio', {
							label: block.attributes.label,
							fieldType: 'radio',
						} )
					);
				} else if ( attributes.options?.length ) {
					newInnerBlocks = map( attributes.options, option =>
						createBlock( 'jetpack/field-option-radio', {
							label: option,
							fieldType: 'radio',
						} )
					);
				}

				return createBlock( 'jetpack/field-radio', attributes, newInnerBlocks );
			},
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-select' ],
			transform: ( attributes, innerBlocks ) => {
				if ( ! isEmpty( innerBlocks ) ) {
					const optionBlocks = filter( innerBlocks, ( { name } ) =>
						startsWith( name, 'jetpack/field-option' )
					);
					attributes.options = map( optionBlocks, b => b.attributes.label );
				}

				attributes.options = attributes.options?.length ? attributes.options : [ '' ];
				return createBlock( 'jetpack/field-select', attributes );
			},
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-consent' ],
			transform: attributes => createBlock( 'jetpack/field-consent', attributes ),
		},
		{
			type: 'block',
			blocks: [ 'jetpack/field-checkbox' ],
			transform: attributes => createBlock( 'jetpack/field-checkbox', attributes ),
		},
	],
};
