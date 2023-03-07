import { __ } from '@wordpress/i18n';

export default {
	text: {
		type: 'string',
		source: 'html',
		selector: 'p',
		default: __(
			'Privacy &amp; Cookies: This site uses cookies. By continuing to use this website, you agree to their use. To find out more, including how to control cookies, see here: <a href="https://automattic.com/cookies/">Cookie Policy</a>.',
			'jetpack'
		),
	},
	style: {
		type: 'object',
		default: {
			color: {
				text: 'var(--wp--preset--color--contrast)',
				background: 'var(--wp--preset--color--tertiary)',
				link: 'var(--wp--preset--color--contrast)',
			},
			spacing: {
				padding: {
					top: '1em',
					right: '1em',
					bottom: '1em',
					left: '1em',
				},
			},
		},
	},
	align: {
		type: 'string',
		default: 'wide',
	},
	consentExpiryDays: {
		type: 'integer',
		default: 365,
	},
	showOverlay: {
		type: 'boolean',
		default: false,
	},
};
