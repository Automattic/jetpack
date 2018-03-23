const {
	registerBlockType,
	InspectorControls,
	InnerBlocks,
} = wp.blocks;

const { createElement } = wp.element;
const { CheckboxControl, TextControl } = wp.components;

const { __ } = wp.i18n;

// Define the form block
let Form = {
	title: __( 'Form' ),
	icon: 'feedback',
	category: 'common',
	description: __( 'Contact Form Settings' ),
	keywords: [
		__( 'form' ),
		__( 'contact' ),
	],
	useOnce: true,
	attributes: {
		subject: {
			type: 'string',
			default: 'Feedback',
		},

		to: {
			type: 'string',
			default: ''
		}
	},

	save: ( { attributes, className } ) => {
		return <div className={ className }>
			<form>
				<InnerBlocks.Content />
			</form>
		</div>
	},

	edit: ( { attributes, setAttributes, className, isSelected } ) => {
		return [
			// Display the inner blocks
			<InnerBlocks
				template={[
					[ 'jetpack/form-text', {
						'label': __( 'Name' ),
						'placeholder': __( 'Full Name' ),
						'required': true,
					} ],
					[ 'jetpack/form-text', {
						'label': __( 'Email' ),
						'placeholder': __( 'example@example.com' ),
						'required': true,
					} ],
					[ 'jetpack/form-textarea', {
						'label': __( 'Message' ),
						'placeholder': __( 'Enter message' ),
						'required': true,
					} ],
					[ 'jetpack/form-button', { 'label': __( 'Send' ) } ]
				]}
				allowedBlocks={ [
					'jetpack/form-text',
					'jetpack/form-textarea',
					'jetpack/form-button'
				] }
			/>,

			// Display on Focus
			!! isSelected &&
				<InspectorControls key="inspector">
					<TextControl
						label={ __( 'Email Subject' ) }
						help={ __( 'What would you like the subject line of the email to be?' ) }
						placeholder={ __( '[Site Feedback]' ) }
						value={ attributes.subject }
						onChange={ value => setAttributes( { 'subject': value } ) }
					/>
					<TextControl
						label={ __( 'Email Address' ) }
						help={ __( 'Which email address should we send the submissions to?' ) }
						value={ attributes.to }
						placeholder={ __( 'admin@example.com' ) }
						onChange={ value => setAttributes( { 'to': value } ) }
					/>
				</InspectorControls>
		];
	},
};

// Register the form block under jetpack/form
registerBlockType( 'jetpack/form', Form );
