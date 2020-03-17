/**
 * External dependencies
 */
import { omit, pick, some } from 'lodash';

/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';

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
		return {
			...omit( attributes, [
				'text',
				'backgroundColor',
				'textColor',
				'customBackgroundColor',
				'customTextColor',
				'borderRadius',
				'gradient',
				'customGradient',
			] ),
			buttonText: attributes.text,
			buttonBackgroundColor: attributes.backgroundColor,
			buttonTextColor: attributes.textColor,
			customButtonBackgroundColor: attributes.customBackgroundColor,
			customButtonTextColor: attributes.customTextColor,
			buttonBorderRadius: attributes.borderRadius,
			buttonGradient: attributes.gradient,
			customButtonGradient: attributes.customGradient,
		};
	},
	isEligible: attributes =>
		some(
			pick( attributes, [
				'text',
				'backgroundColor',
				'textColor',
				'customBackgroundColor',
				'customTextColor',
				'borderRadius',
				'gradient',
				'customGradient',
			] ),
			Boolean
		),
	save: ( { attributes: { revueUsername } } ) => {
		const url = `https://www.getrevue.co/profile/${ revueUsername }`;
		return (
			<div>
				<a href={ url }>{ url }</a>
			</div>
		);
	},
};
