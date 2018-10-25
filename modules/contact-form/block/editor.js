/*global wp*/
/** @jsx wp.element.createElement */
/** @format */

/**
 * External dependencies
 */
import {
	registerBlockType,
	getBlockType,
	createBlock
} from '@wordpress/blocks';

import {
	InnerBlocks
} from '@wordpress/editor';

import {
	__
} from '@wordpress/i18n';

/**
 * Internal dependencies
 */

import './editor.scss';
import JetpackForm from './components/JetpackForm';
import JetpackField from './components/JetpackField';
import JetpackFieldTextarea from './components/JetpackFieldTextarea';
import JetpackFieldCheckbox from './components/JetpackFieldCheckbox';
import JetpackFieldMultiple from './components/JetpackFieldMultiple';

/**
 * Block Registrations:
 */

registerBlockType( 'jetpack/form', {
	title: __( 'Contact Form', 'jetpack' ),
	icon: 'feedback',
	category: 'widgets',
	supports: {
		html: false
	},
	/* // not yet ready for prime time.
	transforms: {
		from: [
			{
				type: 'shortcode',
				tag: 'contact-form',
				attributes: {
					subject: {
						type: 'string',
						shortcode: function( named ) {
							return named.subject;
						},
					},
					to: {
						type: 'string',
						shortcode: function( named ) {
							return named.to;
						},
					},
					submit_button_text: {
						type: 'string',
						shortcode: function( named ) {
							return named.submit_button_text;
						},
					},
				}

			}
		]
	},
	*/

	attributes: {
		subject: {
			type: 'string',
			'default': null
		},
		to: {
			type: 'string',
			'default': null
		},
		submit_button_text: {
			type: 'string',
			'default': __( 'Submit', 'jetpack' )
		}
	},

	edit: function( props ) {
		return (
			<JetpackForm
				key="jetpack/form"
				className={ props.className }
				subject={ props.attributes.subject }
				to={ props.attributes.to }
				submit_button_text={ props.attributes.submit_button_text }
				setAttributes={ props.setAttributes }
			>
				<InnerBlocks
					allowedBlocks={ [] }
					templateLock={false}
					template={ [
						[ 'jetpack/field-name', {
							label: __( 'Name', 'jetpack' ),
							required: true
						} ],
						[ 'jetpack/field-email', {
							label: __( 'Email', 'jetpack' ),
							required: true
						} ],
						[ 'jetpack/field-url', {
							label: __( 'Website', 'jetpack' )
						} ],
						[ 'jetpack/field-textarea', {
							label: __( 'Message', 'jetpack' )
						} ]
					] }
				/>
			</JetpackForm>
		);
	},

	save: function() {
		return (
			<InnerBlocks.Content />
		);
	}
} );

const FieldDefaults = {
	category: 'common',
	parent: [ 'jetpack/form' ],
	supports: {
		html: false
	},
	attributes: {
		label: {
			type: 'string',
			'default': null
		},
		required: {
			type: 'boolean',
			'default': false
		},
		options: {
			type: 'array',
			'default': []
		}
	},
	transforms: {
		to: [
			{
				type: 'block',
				blocks: [ 'jetpack/field-text' ],
				isMatch: ( { options } ) => ! options.length,
				transform: ( attributes )=>createBlock( 'jetpack/field-text', attributes )
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-name' ],
				isMatch: ( { options } ) => ! options.length,
				transform: ( attributes )=>createBlock( 'jetpack/field-name', attributes )
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-email' ],
				isMatch: ( { options } ) => ! options.length,
				transform: ( attributes )=>createBlock( 'jetpack/field-email', attributes )
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-url' ],
				isMatch: ( { options } ) => ! options.length,
				transform: ( attributes )=>createBlock( 'jetpack/field-url', attributes )
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-date' ],
				isMatch: ( { options } ) => ! options.length,
				transform: ( attributes )=>createBlock( 'jetpack/field-date', attributes )
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-telephone' ],
				isMatch: ( { options } ) => ! options.length,
				transform: ( attributes )=>createBlock( 'jetpack/field-telephone', attributes )
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-textarea' ],
				isMatch: ( { options } ) => ! options.length,
				transform: ( attributes )=>createBlock( 'jetpack/field-textarea', attributes )
			},
			/* // not yet ready for prime time.
			{
				type: 'block',
				blocks: [ 'jetpack/field-checkbox' ],
				isMatch: ( { options } ) => 1 === options.length,
				transform: ( attributes )=>createBlock( 'jetpack/field-checkbox', attributes )
			},
			*/
			{
				type: 'block',
				blocks: [ 'jetpack/field-checkbox-multiple' ],
				isMatch: ( { options } ) => 1 <= options.length,
				transform: ( attributes )=>createBlock( 'jetpack/field-checkbox-multiple', attributes )
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-radio' ],
				isMatch: ( { options } ) => 1 <= options.length,
				transform: ( attributes )=>createBlock( 'jetpack/field-radio', attributes )
			},
			{
				type: 'block',
				blocks: [ 'jetpack/field-select' ],
				isMatch: ( { options } ) => 1 <= options.length,
				transform: ( attributes )=>createBlock( 'jetpack/field-select', attributes )
			}
		]
	},
	save : function() {
		return null;
	}
};

const getFieldLabel = function( props ) {
	if ( null === props.attributes.label ) {
		return getBlockType( props.name ).title;
	}
	return props.attributes.label;
};

registerBlockType( 'jetpack/field-text', Object.assign( {
	title: __( 'Text', 'jetpack' ),
	icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M4 9h16v2H4zm0 4h10v2H4z" /></svg>,
	edit: function( props ) {
		return ( <JetpackField
			type="text"
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			setAttributes={ props.setAttributes }
		/> );
	}
}, FieldDefaults ) );

registerBlockType( 'jetpack/field-name', Object.assign( {
	title: __( 'Name', 'jetpack' ),
	icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>,
	edit: function( props ) {
		return ( <JetpackField
			type="text"
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			setAttributes={ props.setAttributes }
		/> );
	}
}, FieldDefaults ) );

registerBlockType( 'jetpack/field-email', Object.assign( {
	title: __( 'Email', 'jetpack' ),
	icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>,
	edit: function( props ) {
		return ( <JetpackField
			type="email"
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			setAttributes={ props.setAttributes }
		/> );
	}
}, FieldDefaults ) );

registerBlockType( 'jetpack/field-url', Object.assign( {
	title: __( 'URL', 'jetpack' ),
	icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z" /></svg>,
	edit: function( props ) {
		return ( <JetpackField
			type="url"
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			setAttributes={ props.setAttributes }
		/> );
	}
}, FieldDefaults ) );

registerBlockType( 'jetpack/field-date', Object.assign( {
	title: __( 'Date', 'jetpack' ),
	icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" /></svg>,
	edit: function( props ) {
		return ( <JetpackField
			type="text"
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			setAttributes={ props.setAttributes }
		/> );
	}
}, FieldDefaults ) );

registerBlockType( 'jetpack/field-telephone', Object.assign( {
	title: __( 'Telephone', 'jetpack' ),
	icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" /></svg>,
	edit: function( props ) {
		return ( <JetpackField
			type="tel"
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			setAttributes={ props.setAttributes }
		/> );
	}
}, FieldDefaults ) );

registerBlockType( 'jetpack/field-textarea', Object.assign( {
	title: __( 'Textarea', 'jetpack' ),
	icon: 'feedback',
	edit: function( props ) {
		return ( <JetpackFieldTextarea
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			setAttributes={ props.setAttributes }
		/> );
	}
}, FieldDefaults ) );

registerBlockType( 'jetpack/field-checkbox', Object.assign( {
	title: __( 'Checkbox', 'jetpack' ),
	icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>,
	edit: function( props ) {
		return ( <JetpackFieldCheckbox
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			setAttributes={ props.setAttributes }
		/> );
	}
}, FieldDefaults ) );

registerBlockType( 'jetpack/field-checkbox-multiple', Object.assign( {
	title: __( 'Checkbox Multiple', 'jetpack' ),
	icon: 'forms',
	edit: function( props ) {
		return ( <JetpackFieldMultiple
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			options={ props.attributes.options }
			setAttributes={ props.setAttributes }
			type="checkbox"
		/> );
	}
}, FieldDefaults ) );

registerBlockType( 'jetpack/field-radio', Object.assign( {
	title: __( 'Radio', 'jetpack' ),
	icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" /></svg>,
	edit: function( props ) {
		return ( <JetpackFieldMultiple
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			options={ props.attributes.options }
			setAttributes={ props.setAttributes }
			type="radio"
		/> );
	}
}, FieldDefaults ) );

registerBlockType( 'jetpack/field-select', Object.assign( {
	title: __( 'Select', 'jetpack' ),
	icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M2 21h19v-3H2v3zM20 8H3c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h17c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zM2 3v3h19V3H2z" /></svg>,
	edit: function( props ) {
		return ( <JetpackFieldMultiple
			label={ getFieldLabel( props ) }
			required={ props.attributes.required }
			options={ props.attributes.options }
			setAttributes={ props.setAttributes }
		/> );
	}
}, FieldDefaults ) );
