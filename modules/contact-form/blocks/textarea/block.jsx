const {
	registerBlockType,
	InspectorControls,
	InnerBlocks,
} = wp.blocks;

const { createElement } = wp.element;
const { ToggleControl, TextControl, TextareaControl, BaseControl } = wp.components;

const { __ } = wp.i18n;

const inputName = ( str ) => str.toLowerCase().replace(/[^a-z0-9]/, '');

// Define the form block
let FormTextarea = {
	title : __( 'Form - Textarea' ),
	icon : 'text',
	category : 'common',
	description: __( 'Multiline text field' ),
	keywords: [
		__( 'text' ),
		__( 'textarea' ),
		__( 'message' ),
	],
	// isPrivate: true,
	attributes: {
		// Set label to display above the input
		label: {
			type: 'string',
			default: 'Text',
		},

		// Inspector: set placeholder value for the input
		placeholder: {
			type: 'string',
			default: '',
		},

		// Inspector: determine if input is required or optional
		isRequired: {
			type: 'boolean',
			default: false,
		},

		// Inspector: number of rows to display
		rows: {
			type: 'number',
			default: 4
		},
	},

	save: ( { attributes, className } ) => {
		// todo: replace with uuid4 + saved as attribute?
		// The id needs to be unique for for="" but also needs to be saved for block validation
		const id = 'jetpack-form-textarea-input-' + inputName( attributes.label );

		return <BaseControl label={ attributes.label } id={ id }>
			<textarea className={ `${className} components-textarea-control__input` }
				type="text"
				id={ id }
				rows={ attributes.rows }
				name={ inputName( attributes.label ) }
				placeholder={ attributes.placeholder }
				required={ attributes.isRequired }
			/>
		</BaseControl>
	},

	edit: ( { attributes, setAttributes, className, isSelected  } ) => {
		if ( ! isSelected ) {
			return FormTextarea.save( { attributes: attributes, className: className } )
		}

		return [
			<TextareaControl
				label={ attributes.label }
				value={ attributes.label }
				placeholder={ __( 'e.g. Message' ) }
				onChange= { value => setAttributes ( { 'label': value } ) }
				required={ true }
				rows={ attributes.rows }
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
				<TextControl
					label={ __( 'Rows' ) }
					help={ __( 'How many lines would you like the text box to be?' ) }
					placeholder={ __( '4' ) }
					value={ attributes.rows }
					onChange={ value => setAttributes( { 'rows': value } ) }
				/>
			</InspectorControls>
		];
	},
};

// Register the form block under jetpack/form
registerBlockType( 'jetpack/form-textarea', FormTextarea );
