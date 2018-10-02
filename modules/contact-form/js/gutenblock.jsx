( function( wp, _ ) {

	const {
		Button,
		PanelBody,
		TextControl,
		TextareaControl,
		CheckboxControl
	} = wp.components;
	const { registerBlockType } = wp.blocks;
	const { InnerBlocks, InspectorControls, BlockControls } = wp.editor;
	const { Component, Fragment } = wp.element;
	const { __ } = wp.i18n;

	class GrunionForm extends Component {
		render( /* { setState } */ ) {
			return (
				<Fragment>
					<InspectorControls>
						<PanelBody title={ __( 'Submission Details', 'jetpack' ) }>
							<TextControl
								label={ __( 'What would you like the subject of the email to be?' ) }
								value={ this.props.subject }
							//	onChange={ ( subject ) => setState( { subject : subject } ) }
							/>
							<TextControl
								label={ __( 'Which email address should we send the submissions to?' ) }
								value={ this.props.to }
							//    onChange={ ( to ) => setState( { to : to } ) }
							/>
						</PanelBody>
					</InspectorControls>
					<div className="grunion-form">
						{this.props.children}
						<Button isPrimary isDefault>Submit</Button>
					</div>
				</Fragment>
			);
		}
	}

	registerBlockType( 'grunion/form', {
		title       : __( 'Contact Form', 'jetpack' ),
		icon        : 'feedback',
		category    : 'widgets',
		supportHTML : false,

		attributes : {
			subject : {
				type    : 'string',
				default : null
			},
			to : {
				type    : 'string',
				default : null
			}
		},

		edit: function( props ) {
			return (
				<GrunionForm key="grunion/form" className={props.className}>
					<InnerBlocks
						allowedBlocks={ [
							'grunion/field-text',
							'grunion/field-email'
						] }
						template={ [
							[ 'grunion/field-name',     { label : __( 'Name' ) } ],
							[ 'grunion/field-email',    { label : __( 'Email' ) } ],
							[ 'grunion/field-text',     { label : __( 'Subject' ) } ],
							[ 'grunion/field-textarea', { label : __( 'Message' ) } ]
						] }
					/>
				</GrunionForm>
			);
		},

		save: function( props ) {
			return (
				<InnerBlocks.Content />
			);
		}
	} );

	class GrunionField extends Component {
		render() {
			var field;
			switch ( this.props.type ) {
				case 'checkbox' :
					field = ( <CheckboxControl
						label={this.props.type + this.props.label}
						disabled={true}
					/> );
					break;
				case 'textarea' :
					field = (<TextareaControl
						label={this.props.type + this.props.label}
						disabled={true}
					/> );
					break;
				default :
					field = ( <TextControl
						type={this.props.type}
						label={this.props.type + this.props.label}
						disabled={true}
					/> );
			}

			return (
				<Fragment>
					<div className="grunion-field">
						{ field }
					</div>
				</Fragment>
			);
		}
	}

	const FieldDefaults = {
		icon        : 'feedback',
		category    : 'widgets',
		parent      : [ 'grunion/form' ],
		supportHTML : false,
		attributes  : {
			label : {
				type : 'string',
				default: __( 'Type here...' )
			}
		},
		save : function() {
			return null;
		}
	};

	registerBlockType( 'grunion/field-name', _.defaults({
		title       : __( 'Name', 'jetpack' ),
		icon        : 'admin-users',
		edit: function( props ) {
			return ( <GrunionField type="text" label={ props.label } /> );
		}
	}, FieldDefaults ) );

	registerBlockType( 'grunion/field-text', _.defaults({
		title       : __( 'Text', 'jetpack' ),
		edit: function( props ) {
			return ( <GrunionField type="text" label={ props.label } /> );
		}
	}, FieldDefaults ) );

	registerBlockType( 'grunion/field-textarea', _.defaults({
		title       : __( 'Textarea', 'jetpack' ),
		edit: function( props ) {
			return ( <GrunionField type="textarea" label={ props.label } /> );
		}
	}, FieldDefaults ) );

	registerBlockType( 'grunion/field-email', _.defaults({
		title       : __( 'Email', 'jetpack' ),
		icon        : 'email',
		edit: function( props ) {
			return ( <GrunionField type="email" label={ props.label } /> );
		}
	}, FieldDefaults ) );

	registerBlockType( 'grunion/field-url', _.defaults({
		title       : __( 'URL', 'jetpack' ),
		icon        : 'share-alt2',
		edit: function( props ) {
			return ( <GrunionField type="url" label={ props.label } /> );
		}
	}, FieldDefaults ) );

	registerBlockType( 'grunion/field-date', _.defaults({
		title       : __( 'Date', 'jetpack' ),
		icon        : 'calendar-alt',
		edit: function( props ) {
			return ( <GrunionField type="text" label={ props.label } /> );
		}
	}, FieldDefaults ) );

	registerBlockType( 'grunion/field-telephone', _.defaults({
		title       : __( 'Telephone', 'jetpack' ),
		icon        : 'phone',
		edit: function( props ) {
			return ( <GrunionField type="tel" label={ props.label } /> );
		}
	}, FieldDefaults ) );

	registerBlockType( 'grunion/field-radio', _.defaults({
		title       : __( 'Radio', 'jetpack' ),
		edit: function( props ) {
			return ( <GrunionField type="radio" label={ props.label } /> );
		}
	}, FieldDefaults ) );

	registerBlockType( 'grunion/field-select', _.defaults({
		title       : __( 'Select', 'jetpack' ),
		edit: function( props ) {
			return ( <GrunionField type="select" label={ props.label } /> );
		}
	}, FieldDefaults ) );

	registerBlockType( 'grunion/field-checkbox', _.defaults({
		title       : __( 'Checkbox', 'jetpack' ),
		icon        : 'forms',
		edit: function( props ) {
			return ( <GrunionField type="checkbox" label={ props.label } /> );
		}
	}, FieldDefaults ) );

	registerBlockType( 'grunion/field-checkbox-multiple', _.defaults({
		title       : __( 'Checkbox Multiple', 'jetpack' ),
		icon        : 'forms',
		edit: function( props ) {
			return ( <GrunionField type="checkbox-multiple" label={ props.label } /> );
		}
	}, FieldDefaults ) );

} )( window.wp, _ );
