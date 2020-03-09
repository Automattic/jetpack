const urlValidator = url => ! url || url.startsWith( 'http' );

export default {
	url: {
		type: 'string',
		validator: urlValidator,
	},
	itemsToShow: {
		type: 'integer',
		default: 5,
	},
};
