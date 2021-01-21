/**
 * External dependencies
 */
import { pickBy, identity } from 'lodash';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

const getAttributeValue = ( tag, att, content ) => {
	const dbqts = content.match( new RegExp( `\\[${tag}[^\\]]* ${att}="([^"]*)"`, 'im' ) );
    if ( dbqts != null && dbqts.length > 0 ) {
        return dbqts[ 1 ];
    }

	const sinqts = content.match( new RegExp( `\\[${tag}[^\\]]* ${att}='([^']*)'`, 'im' ) );
	if ( sinqts != null && sinqts.length > 0 ) {
		return sinqts[ 1 ];
    }

	const noqts = content.match( new RegExp( `\\[${tag}[^\\]]* ${att}=([^\\s]*)\\s`, 'im' ) );
    if ( noqts != null && noqts.length > 0 ) {
       return noqts[ 1 ];
    }

	return false;
};

const getContactFieldBlockName = ( type ) => {
    const prefix = 'jetpack';

    switch ( type ) {
        case 'text': case 'url':
            return `${prefix}/field-text`;
        case 'textarea':
            return `${prefix}/field-textarea`;
        case 'radio':
            return `${prefix}/field-radio`;
        case 'checkbox':
            return `${prefix}/field-checkbox`;
        case 'select':
            return `${prefix}/field-select`;
        case 'email':
            return `${prefix}/field-email`;
        case 'name':
            return `${prefix}/field-name`;
        default:
            return `${prefix}/field-text`;
    }
};

const transformContactFormShortcode = ( shortcode ) => {
    const blockAttrs = {
        to: getAttributeValue( 'contact-form', 'to', shortcode ),
        subject: getAttributeValue( 'contact-form', 'subject', shortcode ),
        submitButtonText: getAttributeValue( 'contact-form', 'submit_button_text', shortcode )
    };

    return {
        blockName: 'jetpack/contact-form',
        attrs: pickBy( blockAttrs, identity )
    };
};

const transformContactFieldShortcode = ( shortcode ) => {
    const blockAttrs = {
        label: getAttributeValue( 'contact-field', 'label', shortcode ),
        placeholder: getAttributeValue( 'contact-field', 'placeholder', shortcode ),
        required: getAttributeValue( 'contact-field', 'required', shortcode ),
        options: getAttributeValue( 'contact-field', 'options', shortcode ),
    };

    const blockName = getContactFieldBlockName( getAttributeValue( 'contact-field', 'type', shortcode ) );

    // Split block option values into an array.
    if ( blockAttrs.options ) {
        blockAttrs.options = blockAttrs.options.split( ',' );
    }

    return createBlock( blockName, pickBy( blockAttrs, identity ) );
};

const blockData = {
    root: {},
    innerBlocks: []
};

export default {
    from: [
        {
            type: 'raw',
            priority: 1,
            isMatch: ( node ) => {
                if (
                    node.nodeName === 'P' &&
                    ( /\[contact-form(\s.*?)?\](?:([^\[]+)?)?/g.test( node.textContent ) ||
                    /\[contact-field(\s.*?)?\](?:([^\[]+)?)?/g.test( node.textContent ) ||
                    /\[\/contact-form]/g.test( node.textContent ) )
                ) {
                    return true;
                }

                return false;
            },
            transform: ( node ) => {
                const shortCode = node.textContent;

                if ( shortCode.includes( '[contact-form' ) ) {
                    blockData.root = transformContactFormShortcode( shortCode );
                }

                if ( shortCode.includes( '[contact-field' ) ) {
                    blockData.innerBlocks.push( transformContactFieldShortcode( shortCode ) );
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
            }
        }
    ]
};
