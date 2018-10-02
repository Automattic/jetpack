( function( wp, _ ) {

	const { Button } = wp.components;
	const { registerBlockType } = wp.blocks;
	const { InnerBlocks } = wp.editor;
	const { Component } = wp.element;
	const { __ } = wp.i18n;

	class GrunionForm extends Component {
		render() {
			return (
				<div className="grunion-form">
					<h4>before</h4>
					{this.props.children}
					<Button isPrimary isDefault>Submit</Button>
				</div>
			);
		}
	}

	registerBlockType( 'grunion/form', {
		title       : __( 'Contact Form', 'jetpack' ),
		icon        : 'feedback',
		category    : 'widgets',
		supportHTML : false,

		attributes : {
			to : {
				type    : 'string',
				default : null
			},
		},

		edit: function( props ) {
			return (
				<GrunionForm className={props.className}>
					<p>foo</p>
					<InnerBlocks />
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
			return (
				<div className="grunion-field">
					field
				</div>
			);
		}
	}

	registerBlockType( 'grunion/field', {
		title       : __( 'Input Field', 'jetpack' ),
		icon        : 'feedback',
		category    : 'widgets',
		parent      : [ 'grunion/form' ],
		supportHTML : false,

		attributes : {
			type : {
				type    : 'string',
				default : 'text'
			},
		},

		edit: function( props ) {
			return ( <GrunionField /> );
		},

		save: function( props ) {
			return null;
		}
	} );

} )( window.wp, _ );
