const urlValidator = url => ! url || url.startsWith( 'http' );

export default {
	url: {
		type: 'string',
		validator: urlValidator,
	},
	eventId: {
		type: 'number',
	},
	style: {
		type: 'string',
		default: 'inline',
	},
};
