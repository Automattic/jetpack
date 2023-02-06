import { createBlock } from '@wordpress/blocks';
import { _x, __ } from '@wordpress/i18n';
import { isEmpty, omit, pick, some } from 'lodash';

const deprecatedAttributes = [
	'text',
	'backgroundColor',
	'textColor',
	'customBackgroundColor',
	'customTextColor',
	'borderRadius',
	'gradient',
	'customGradient',
];

export default {
	attributes: {
		revueUsername: {
			type: 'string',
		},
		text: {
			type: 'string',
			default: _x( 'Subscribe', 'verb: e.g. subscribe to a newsletter.', 'jetpack' ),
		},
		emailLabel: {
			type: 'string',
			default: __( 'Email address', 'jetpack' ),
		},
		emailPlaceholder: {
			type: 'string',
			default: __( 'Enter your email address', 'jetpack' ),
		},
		firstNameLabel: {
			type: 'string',
			default: __( 'First name', 'jetpack' ),
		},
		firstNamePlaceholder: {
			type: 'string',
			default: __( 'Enter your first name', 'jetpack' ),
		},
		firstNameShow: {
			type: 'boolean',
			default: true,
		},
		lastNameLabel: {
			type: 'string',
			default: __( 'Last name', 'jetpack' ),
		},
		lastNamePlaceholder: {
			type: 'string',
			default: __( 'Enter your last name', 'jetpack' ),
		},
		lastNameShow: {
			type: 'boolean',
			default: true,
		},
		backgroundColor: {
			type: 'string',
		},
		textColor: {
			type: 'string',
		},
		customBackgroundColor: {
			type: 'string',
		},
		customTextColor: {
			type: 'string',
		},
		borderRadius: {
			type: 'number',
		},
		gradient: {
			type: 'string',
		},
		customGradient: {
			type: 'string',
		},
	},
	migrate: attributes => {
		const newAttributes = omit( attributes, deprecatedAttributes );
		const buttonAttributes = pick( attributes, deprecatedAttributes );

		const newInnerBlocks = [
			createBlock( 'jetpack/button', {
				element: 'button',
				text: buttonAttributes.text || 'Subscribe',
				...buttonAttributes,
			} ),
		];

		return [ newAttributes, newInnerBlocks ];
	},
	isEligible: ( attributes, innerBlocks ) =>
		isEmpty( innerBlocks ) || some( pick( attributes, deprecatedAttributes ), Boolean ),
	save: ( { attributes: { revueUsername } } ) => {
		const url = `https://www.getrevue.co/profile/${ revueUsername }`;
		return (
			<div>
				<a href={ url }>{ url }</a>
			</div>
		);
	},
};
