const {
	registerBlockType,
	InspectorControls,
	InnerBlocks,
} = wp.blocks;

const { createElement } = wp.element;
const { ToggleControl, TextControl, BaseControl } = wp.components;

const { __ } = wp.i18n;

const inputName = ( str ) => str.toLowerCase().replace(/[^a-z0-9]/, '');

// Define the form block
let FormText = {
	title : __( 'Form - Text' ),
	icon : 'editor-textcolor',
	category : 'common',
	description: __( 'Text field' ),
	keywords: [
		__( 'text' ),
		__( 'name' ),
		__( 'email' ),
	],
	// isPrivate: true,
	attributes: {
		// Set label to display above the input
		label: {
			type: 'string',
			default: 'Custom Text',
 		},

		// Inspector: set placeholder value for the input
		placeholder: {
			type: 'string',
			default: '',
		},

		// Inspector: determine if input is required or optional
		isRequired : {
			type : 'boolean',
			default : true,
		},
	},

	save: ( { attributes, className } ) => {
		// todo: replace with uuid4 + saved as attribute?
		// The id needs to be unique for for="" but also needs to be saved for block validation
		const id = 'jetpack-form-text-input-' + inputName( attributes.label );

		return <BaseControl label={ attributes.label } id={ id }>
			<input className={ `${className} components-text-control__input` }
				type="text"
				id={ id }
				name={ inputName( attributes.label ) }
				placeholder={ attributes.placeholder }

			/>
		</BaseControl>
	},

	edit: ( { attributes, setAttributes, className, isSelected } ) => {
		if ( ! isSelected ) {
			return FormText.save( { attributes: attributes, className: className } )
		}

		return [
			<TextControl
				label={ attributes.label }
				value={ attributes.label }
				placeholder={ __( 'e.g. Name' ) }
				onChange= { value => setAttributes ( { 'label': value  } ) }
				required={ true }
			/>,
			<InspectorControls key="inspector">
				<TextControl
					label={ __( 'Placeholder Text' ) }
					help={ __( 'Text shown when field is empty.' ) }
					placeholder={ __( 'Placeholder' ) }
					value={ attributes.placeholder }
					onChange={ value => setAttributes( { 'placeholder': value } ) }
				/>
				<ToggleControl
					label={ __( 'Is required?' ) }
					help={ ( checked ) => checked ? __( 'Field must be filled out.' ) : __( 'Field is optional.' ) }
					checked={ !! attributes.isRequired }
					onChange={ value => setAttributes( { 'isRequired': value } ) }
				/>
			</InspectorControls>
		];
	},
};

// Register the form block under jetpack/form
registerBlockType( 'jetpack/form-text', FormText );
