import { __ } from '@wordpress/i18n';
import defaultSettings from '../shared/settings/index.js';
import deprecated from './deprecated.js';
import edit from './edit.jsx';
import blockIcon from './icon.jsx';
import save from './save.jsx';

export const name = 'field-consent';

export const form_editor = {
	category: 'advanced',
};

export const settings = {
	...defaultSettings,
	title: __( 'Terms consent', 'jetpack-forms' ),
	keywords: [ __( 'Consent', 'jetpack-forms' ) ],
	description: __(
		'Communicate site terms and offer visitors consent to those terms.',
		'jetpack-forms'
	),
	icon: blockIcon,
	edit,
	attributes: {
		...defaultSettings.attributes,
		consentType: {
			type: 'string',
			default: 'implicit',
		},
		defaultValue: {
			type: 'string',
			default: '',
		},
		implicitConsentMessage: {
			type: 'string',
			default: __(
				"By submitting your information, you're giving us permission to email you. You may unsubscribe at any time.",
				'jetpack-forms'
			),
		},
		explicitConsentMessage: {
			type: 'string',
			default: __( 'Can we send you an email from time to time?', 'jetpack-forms' ),
		},
	},
	providesContext: {
		...defaultSettings.providesContext,
		'jetpack/field-default-value': 'defaultValue',
	},
	deprecated,
	save,
	example: {
		innerBlocks: [
			{
				name: 'jetpack/option',
				attributes: {
					label: __(
						"By submitting your information, you're giving us permission to email you. You may unsubscribe at any time.",
						'jetpack-forms'
					),
					isStandalone: true,
					hideInput: true,
				},
			},
		],
	},
};

export default {
	name,
	settings,
	form_editor,
};
