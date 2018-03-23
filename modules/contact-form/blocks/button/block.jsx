const {
	registerBlockType,
	InspectorControls,
	InnerBlocks,
} = wp.blocks;

const { createElement } = wp.element;
const { ToggleControl, TextControl, ButtonGroup, Button, RadioControl } = wp.components;

const { __ } = wp.i18n;

const inputName = (str) => str.toLowerCase().replace(/[^a-z0-9]/, '');

// Define the form block
let FormButton = {
	title : __( 'Form - Submit' ),
	icon : 'button',
	category : 'common',
	description: __( 'A submit button' ),
	keywords: [
		__( 'send' ),
		__( 'submit' ),
		__( 'contact' ),
	],
	useOnce: true,
	// isPrivate: true,
	attributes: {
		label: {
			type: 'string',
			default: 'Submit',
		}
	},

	save: ( { attributes, className } ) => {
		return <div className={ className }>
			<Button isPrimary={ true } type={ "submit" }>
				{ attributes.label }
			</Button>
		</div>
	},
	edit: ( { attributes, setAttributes, className, isSelected } ) => {
		if ( ! isSelected ) {
			return <div className={ className }>
				<Button isPrimary={ true } type={ "submit" }>
					{ attributes.label }
				</Button>
			</div>
		}

		return [
			<TextControl
				label={ __( 'Button Text' ) }
				placeholder={ __( 'Submit' ) }
				value={ attributes.label }
				onChange={ value => setAttributes( { 'label': value } ) }
			/>
		];
	},
};

// Register the form block under jetpack/form
registerBlockType( 'jetpack/form-button', FormButton );
