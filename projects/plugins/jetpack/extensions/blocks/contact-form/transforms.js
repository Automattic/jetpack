/**
 * External dependencies
 */
import { pickBy, identity } from 'lodash';
import { createBlock } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';

const getAttributeValue = ( tag, att, content ) => {
	var re = new RegExp( `\\[${tag}[^\\]]* ${att}="([^"]*)"`, 'im' );
	var result = content.match( re );

    if ( result != null && result.length > 0 ) {
        return result[ 1] ;
    }

	re = new RegExp( `\\[${tag}[^\\]]* ${att}='([^']*)'`, 'im' );
	result = content.match( re );
	if ( result != null && result.length > 0 ) {
		return result[ 1 ];
    }

	re = new RegExp(`\\[${tag}[^\\]]* ${att}=([^\\s]*)\\s`, 'im');
	result = content.match( re );

    if ( result != null && result.length > 0 ) {
       return result[ 1 ];
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
            isMatch: ( node ) => {
                if (
                    node.nodeName === 'P' &&
                    ( /\[contact-form(\s.*?)?\](?:([^\[]+)?\[\/contact-form\])?/g.test( node.textContent ) ||
                    /\[contact-field(\s.*?)?\](?:([^\[]+)?\[\/contact-field\])?/g.test( node.textContent ) ||
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
                    return;
                }

                if ( shortCode.includes( '[contact-field' ) ) {
                    blockData.innerBlocks.push( transformContactFieldShortcode( shortCode ) );
                    return;
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
            priority: 1
        }
    ]
};
