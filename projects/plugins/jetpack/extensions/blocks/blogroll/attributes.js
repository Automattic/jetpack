export default {
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
};
