import { createBlock } from '@wordpress/blocks';
import { __, sprintf } from '@wordpress/i18n';

const textFields = [
	'jetpack/field-text',
	'jetpack/field-email',
	'jetpack/field-name',
	'jetpack/field-url',
	'jetpack/field-telephone',
	'jetpack/field-textarea',
	'jetpack/field-number',
	'jetpack/field-date',
];

const choiceFields = [ 'jetpack/field-checkbox-multiple', 'jetpack/field-radio' ];
const singleOptionFields = [ 'jetpack/field-checkbox', 'jetpack/field-consent' ];

const fieldConfig = {
	// Text-based fields.
	'jetpack/field-text': {
		type: 'text',
		label: __( 'Text', 'jetpack-forms' ),
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
	},
	'jetpack/field-name': {
		type: 'text',
		label: __( 'Name', 'jetpack-forms' ),
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
	},
	'jetpack/field-email': {
		type: 'email',
		label: __( 'Email', 'jetpack-forms' ),
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
	},
	'jetpack/field-url': {
		type: 'url',
		label: __( 'Website', 'jetpack-forms' ),
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
	},
	'jetpack/field-telephone': {
		type: 'tel',
		label: __( 'Phone', 'jetpack-forms' ),
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
	},
	'jetpack/field-textarea': {
		type: 'textarea',
		label: __( 'Message', 'jetpack-forms' ),
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
	},
	'jetpack/field-number': {
		type: 'number',
		label: __( 'Number', 'jetpack-forms' ),
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
	},
	'jetpack/field-date': {
		type: 'text',
		label: __( 'Date', 'jetpack-forms' ),
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
	},
	'jetpack/field-select': {
		type: 'dropdown',
		label: '',
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
	},
	// Choice-based fields.
	'jetpack/field-checkbox-multiple': {
		type: 'checkbox',
		label: __( 'Choose several options', 'jetpack-forms' ),
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
	},
	'jetpack/field-radio': {
		type: 'radio',
		label: __( 'Choose one option', 'jetpack-forms' ),
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
	},
	// Single option fields.
	'jetpack/field-checkbox': {
		type: 'checkbox',
		label: '',
		defaultLabel: __( 'Add label…', 'jetpack-forms' ),
		extraAttributes: {
			isStandalone: true,
			hideInput: false,
		},
	},
	'jetpack/field-consent': {
		type: 'checkbox',
		label: '',
		defaultLabel: sprintf(
			/* translators: placeholder is a type of consent: implicit or explicit */
			__( 'Add %s consent message…', 'jetpack-forms' ),
			'implicit'
		),
		extraAttributes: {
			isStandalone: true,
			hideInput: true,
		},
	},
};

const getFieldAttributes = attributes => ( {
	required: attributes.required || false,
	width: attributes.width || 100,
	id: attributes.id || '',
	shareFieldAttributes: attributes.shareFieldAttributes ?? true,
} );

const getOptionLabelsFromInnerBlocks = innerBlocks => {
	const labels = [];

	const optionsBlock = innerBlocks.find( block => block.name === 'jetpack/options' );
	if ( optionsBlock?.innerBlocks?.length ) {
		labels.push( ...optionsBlock.innerBlocks.map( block => block.attributes.label ?? '' ) );
	} else {
		const optionBlock = innerBlocks.find( block => block.name === 'jetpack/option' );
		if ( optionBlock ) {
			labels.push( optionBlock.attributes.label ?? '' );
		}
	}

	return labels;
};

const createTextFieldInnerBlocks = ( blockName, existingInnerBlocks = [] ) => {
	const config = fieldConfig[ blockName ];
	if ( ! config ) {
		return [];
	}

	const existingLabel = existingInnerBlocks.find( block => block.name === 'jetpack/label' );
	const existingInput = existingInnerBlocks.find( block => block.name === 'jetpack/input' );

	return [
		createBlock( 'jetpack/label', {
			...( existingLabel?.attributes || {} ),
			label: config.label,
			defaultLabel: config.defaultLabel,
		} ),
		createBlock( 'jetpack/input', {
			...( existingInput?.attributes || {} ),
			type: config.type,
		} ),
	];
};

const createChoiceFieldInnerBlocks = ( blockName, existingInnerBlocks = [], attributes = {} ) => {
	const config = fieldConfig[ blockName ];
	if ( ! config ) {
		return [];
	}

	const existingLabel = existingInnerBlocks.find( block => block.name === 'jetpack/label' );
	const existingOptions = existingInnerBlocks.find( block => block.name === 'jetpack/options' );

	const label = createBlock( 'jetpack/label', {
		...( existingLabel?.attributes || {} ),
		label: config.label,
		defaultLabel: config.defaultLabel,
	} );

	let optionBlocks = [];
	if ( existingOptions?.innerBlocks ) {
		optionBlocks = existingOptions.innerBlocks.map( block =>
			createBlock( 'jetpack/option', {
				...block.attributes,
			} )
		);
	} else if ( attributes.options?.length ) {
		optionBlocks = attributes.options.map( optionLabel =>
			createBlock( 'jetpack/option', {
				label: optionLabel,
			} )
		);
	} else {
		optionBlocks = [ createBlock( 'jetpack/option' ) ];
	}

	const options = createBlock(
		'jetpack/options',
		{
			...( existingOptions?.attributes || {} ),
			type: config.type,
		},
		optionBlocks
	);

	return [ label, options ];
};

const createSingleOptionFieldInnerBlocks = ( blockName, existingInnerBlocks = [] ) => {
	const config = fieldConfig[ blockName ];
	if ( ! config ) {
		return [];
	}

	const existingOption = existingInnerBlocks.find( block => block.name === 'jetpack/option' );

	return [
		createBlock( 'jetpack/option', {
			...( existingOption?.attributes || {} ),
			label: config.label,
			defaultLabel: config.defaultLabel,
			...config.extraAttributes,
		} ),
	];
};

const textFieldTransforms = textFields.map( blockName => ( {
	type: 'block',
	blocks: [ blockName ],
	transform: ( attributes, innerBlocks = [] ) => {
		return createBlock(
			blockName,
			getFieldAttributes( attributes ),
			createTextFieldInnerBlocks( blockName, innerBlocks )
		);
	},
} ) );

const choiceFieldTransforms = choiceFields.map( blockName => ( {
	type: 'block',
	blocks: [ blockName ],
	transform: ( attributes, innerBlocks = [] ) => {
		return createBlock(
			blockName,
			getFieldAttributes( attributes ),
			createChoiceFieldInnerBlocks( blockName, innerBlocks, attributes )
		);
	},
} ) );

const singleOptionFieldTransforms = singleOptionFields.map( blockName => ( {
	type: 'block',
	blocks: [ blockName ],
	transform: ( attributes, innerBlocks = [] ) => {
		const fieldAttributes = getFieldAttributes( attributes );
		return createBlock(
			blockName,
			{
				...fieldAttributes,
				required: blockName === 'jetpack/field-consent' ? false : fieldAttributes.required,
			},
			createSingleOptionFieldInnerBlocks( blockName, innerBlocks )
		);
	},
} ) );

const transforms = {
	from: [],
	to: [
		...textFieldTransforms,
		...choiceFieldTransforms,
		...singleOptionFieldTransforms,
		{
			type: 'block',
			blocks: [ 'jetpack/field-select' ],
			transform: ( attributes, innerBlocks = [] ) => {
				const optionLabels = getOptionLabelsFromInnerBlocks( innerBlocks );
				return createBlock(
					'jetpack/field-select',
					{
						...getFieldAttributes( attributes ),
						options: optionLabels.length ? optionLabels : [ '' ],
					},
					createTextFieldInnerBlocks(
						'jetpack/field-select',
						/**
						 * When transforming to a select field, add a default placeholder in a non mutating way
						 * to the input block if none exists.
						 *
						 * This is because the input block is created by the textFieldTransforms,
						 * and we want to avoid mutating the original block.
						 * The select block's edit.js checks for the placeholder attribute on the input block,
						 * and add the `has-placeholder` class to the field if it exists.
						 * However if the incoming transformed block doesn't have a placeholder, the edit.js will
						 * not add the class because it's trying to honor the placeholder attribute,
						 * BUT adds a default placeholder anyway.
						 */
						innerBlocks.map( block => {
							if ( block?.name === 'jetpack/input' ) {
								return {
									...block,
									attributes: {
										...( block?.attributes || {} ),
										placeholder:
											block?.attributes?.placeholder || __( 'Select one option', 'jetpack-forms' ),
									},
								};
							}
							return block;
						} )
					)
				);
			},
		},
	],
};

export default transforms;
