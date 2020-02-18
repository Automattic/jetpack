/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import attributes from './attributes';
import edit from './edit';
import { SubmitButtonSave } from '../../shared/submit-button';
import icon from './icon';
import { getAttributesFromEmbedCode, REGEX } from './utils';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'calendly';
export const title = __( 'Calendly', 'jetpack' );
export const settings = {
	title,
	description: __( 'Embed a calendar for customers to schedule appointments', 'jetpack' ),
	icon,
	category: 'jetpack',
	keywords: [
		__( 'calendar', 'jetpack' ),
		__( 'schedule', 'jetpack' ),
		__( 'appointments', 'jetpack' ),
	],
	supports: {
		align: true,
		alignWide: false,
		html: false,
	},
	edit,
	save: function( { attributes: buttonAttributes } ) {
		return (
			<SubmitButtonSave className="wp-block-jetpack-calendly" attributes={ buttonAttributes } />
		);
	},
	attributes,
	example: {
		attributes: {
			submitButtonText: __( 'Schedule time with me', 'jetpack' ),
			hideEventTypeDetails: false,
			style: 'inline',
			url: 'https://calendly.com/wordpresscom/jetpack-block-example',
		},
	},
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: node => node.nodeName === 'P' && REGEX.test( node.textContent ),
				transform: node => {
					const newAttributes = getAttributesFromEmbedCode( node.textContent );
					return createBlock( 'jetpack/calendly', newAttributes );
				},
			},
		],
	},
	deprecated: [
		{
			attributes,
			save: ( { attributes: { url } } ) => <a href={ url }>{ url }</a>,
		},
	],
};
