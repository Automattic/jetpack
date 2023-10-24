const urlValidator = url =>
	! url || url.startsWith( 'https://nextdoor.' ) || url.includes( '/embed/' );

export default {
	url: {
		type: 'string',
		validator: urlValidator,
	},
};
