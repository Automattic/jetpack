import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { pickBy, identity } from 'lodash';

const getAttributeValue = ( tag, att, content ) => {
	const doubleQuotes = content.match( new RegExp( `\\[${ tag }[^\\]]* ${ att }="([^"]*)"`, 'im' ) );
	if ( doubleQuotes && doubleQuotes.length ) {
		return doubleQuotes[ 1 ];
	}

	const singleQuotes = content.match( new RegExp( `\\[${ tag }[^\\]]* ${ att }='([^']*)'`, 'im' ) );
	if ( singleQuotes && singleQuotes.length ) {
		return singleQuotes[ 1 ];
	}

	const noQuotes = content.match( new RegExp( `\\[${ tag }[^\\]]* ${ att }=([^\\s]*)\\s`, 'im' ) );
	if ( noQuotes && noQuotes.length ) {
		return noQuotes[ 1 ];
	}

	return false;
};

const getContactFieldBlockName = type => {
	const prefix = 'jetpack';

	const fieldTypes = {
		text: `${ prefix }/field-text`,
		url: `${ prefix }/field-text`,
		textarea: `${ prefix }/field-textarea`,
		radio: `${ prefix }/field-radio`,
		checkbox: `${ prefix }/field-checkbox`,
		'checkbox-multiple': `${ prefix }/field-checkbox-multiple`,
		select: `${ prefix }/field-select`,
		email: `${ prefix }/field-email`,
		name: `${ prefix }/field-name`,
		default: `${ prefix }/field-text`,
	};
	return fieldTypes[ type ] ? fieldTypes[ type ] : fieldTypes.default;
};

const transformContactFormShortcode = shortcode => {
	const blockAttrs = {
		to: getAttributeValue( 'contact-form', 'to', shortcode ),
		subject: getAttributeValue( 'contact-form', 'subject', shortcode ),
		submitButtonText: getAttributeValue( 'contact-form', 'submit_button_text', shortcode ),
	};

	return {
		blockName: 'jetpack/contact-form',
		attrs: pickBy( blockAttrs, identity ),
	};
};

const transformContactFieldShortcode = shortcode => {
	const blockAttrs = {
		label: getAttributeValue( 'contact-field', 'label', shortcode ),
		placeholder: getAttributeValue( 'contact-field', 'placeholder', shortcode ),
		required: getAttributeValue( 'contact-field', 'required', shortcode ),
		options: getAttributeValue( 'contact-field', 'options', shortcode ),
	};

	const blockName = getContactFieldBlockName(
		getAttributeValue( 'contact-field', 'type', shortcode )
	);

	// Split block option values into an array.
	if ( blockAttrs.options ) {
		blockAttrs.options = blockAttrs.options.split( ',' );
	}

	return createBlock( blockName, pickBy( blockAttrs, identity ) );
};

const blockData = {
	root: {},
	innerBlocks: [],
};

export default {
	from: [
		{
			type: 'raw',
			priority: 1,
			isMatch: node => {
				/* eslint-disable no-useless-escape */
				if (
					node.nodeName === 'P' &&
					( /\[contact-form(\s.*?)?\](?:([^\[]+)?)?/g.test( node.textContent ) ||
						/\[contact-field(\s.*?)?\](?:([^\[]+)?)?/g.test( node.textContent ) ||
						/\[\/contact-form]/g.test( node.textContent ) )
				) {
					return true;
				}
				/* eslint-enable no-useless-escape */

				return false;
			},
			transform: node => {
				const shortCode = node.textContent.replace( '<br>', '' );

				if ( shortCode.includes( '[contact-form' ) ) {
					blockData.root = {};
					blockData.innerBlocks = [];

					blockData.root = transformContactFormShortcode( shortCode );
				}

				if ( shortCode.includes( '[contact-field' ) ) {
					const fields = shortCode.match( /(\[contact-field[\s\S]*?\/?])/g );

					if ( fields && fields.length > 0 ) {
						fields.forEach( field => {
							blockData.innerBlocks.push( transformContactFieldShortcode( field ) );
						} );
					}
				}

				if ( shortCode.includes( '[/contact-form]' ) ) {
					blockData.innerBlocks.push(
						createBlock( 'jetpack/button', {
							element: 'button',
							text: blockData.root.attrs.submitButtonText || __( 'Contact Us', 'jetpack' ),
						} )
					);

					const block = createBlock(
						blockData.root.blockName,
						blockData.root.attrs,
						blockData.innerBlocks
					);

					return block;
				}

				return false;
			},
		},
	],
};
