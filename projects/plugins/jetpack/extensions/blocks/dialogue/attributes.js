export default {
	participantLabel: {
		type: 'string',
	},
	participantSlug: {
		type: 'string',
	},
	timestamp: {
		type: 'string',
		default: '00:00',
	},
	showTimestamp: {
		type: 'boolean',
		default: false,
	},
	placeholder: {
		type: 'string',
	},
	content: {
		type: 'string',
		source: 'html',
		selector: '.wp-block-jetpack-dialogue__content',
	},
};
