( function( wp, _ ) {

	const { Button, PanelBody, TextControl } = wp.components;
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
			console.log( this.props );
			return (
				<Fragment>
					<div className="grunion-field">
                        <TextControl
							type={ this.props.type }
                            label={ this.props.type + this.props.label }
							disabled={true}
                        />
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

    registerBlockType( 'grunion/field-email', _.defaults({
        title       : __( 'Email', 'jetpack' ),
        edit: function( props ) {
            return ( <GrunionField type="email" label={ props.label } /> );
        }
    }, FieldDefaults ) );

    registerBlockType( 'grunion/field-url', _.defaults({
        title       : __( 'URL', 'jetpack' ),
        edit: function( props ) {
            return ( <GrunionField type="url" label={ props.label } /> );
        }
    }, FieldDefaults ) );

    registerBlockType( 'grunion/field-date', _.defaults({
        title       : __( 'Date', 'jetpack' ),
        edit: function( props ) {
            return ( <GrunionField type="text" label={ props.label } /> );
        }
    }, FieldDefaults ) );

    registerBlockType( 'grunion/field-telephone', _.defaults({
        title       : __( 'Telephone', 'jetpack' ),
        edit: function( props ) {
            return ( <GrunionField type="tel" label={ props.label } /> );
        }
    }, FieldDefaults ) );

    registerBlockType( 'grunion/field-radio', _.defaults({
        title       : __( 'Date', 'jetpack' ),
        edit: function( props ) {
            return ( <GrunionField type="radio" label={ props.label } /> );
        }
    }, FieldDefaults ) );

    registerBlockType( 'grunion/field-select', _.defaults({
        title       : __( 'Date', 'jetpack' ),
        edit: function( props ) {
            return ( <GrunionField type="select" label={ props.label } /> );
        }
    }, FieldDefaults ) );

    registerBlockType( 'grunion/field-checkbox', _.defaults({
        title       : __( 'Date', 'jetpack' ),
        edit: function( props ) {
            return ( <GrunionField type="checkbox" label={ props.label } /> );
        }
    }, FieldDefaults ) );

    registerBlockType( 'grunion/field-checkbox-multiple', _.defaults({
        title       : __( 'Date', 'jetpack' ),
        edit: function( props ) {
            return ( <GrunionField type="checkbox-multiple" label={ props.label } /> );
        }
    }, FieldDefaults ) );

} )( window.wp, _ );
