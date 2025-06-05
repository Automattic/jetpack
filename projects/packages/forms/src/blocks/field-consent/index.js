import { Path } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../contact-form/util/block-icons';
import renderMaterialIcon from '../contact-form/util/render-material-icon';
import defaultSettings from '../shared/settings';
import deprecated from './deprecated';
import edit from './edit';
import save from './save';

const name = 'field-consent';
const settings = {
	...defaultSettings,
	title: __( 'Terms Consent', 'jetpack-forms' ),
	keywords: [ __( 'Consent', 'jetpack-forms' ) ],
	description: __(
		'Communicate site terms and offer visitors consent to those terms.',
		'jetpack-forms'
	),
	icon: {
		foreground: getIconColor(),
		src: renderMaterialIcon(
			<>
				<Path d="M7 5.5H17C17.2761 5.5 17.5 5.72386 17.5 6V13H19V6C19 4.89543 18.1046 4 17 4H7C5.89543 4 5 4.89543 5 6V18C5 19.1046 5.89543 20 7 20H11.5V18.5H7C6.72386 18.5 6.5 18.2761 6.5 18V6C6.5 5.72386 6.72386 5.5 7 5.5ZM16 7.75H8V9.25H16V7.75ZM8 11H13V12.5H8V11Z" />
				<Path d="M20.1087 15.9382L15.9826 21.6689L12.959 18.5194L14.0411 17.4806L15.8175 19.331L18.8914 15.0618L20.1087 15.9382Z" />
			</>
		),
	},
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
};
