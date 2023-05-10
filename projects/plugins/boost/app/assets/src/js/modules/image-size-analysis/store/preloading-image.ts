const imageShape = {
	id: '1',
	thumbnail: '',
	image: {
		url: '',
		dimensions: {
			file: {
				width: 0,
				height: 0,
			},
			expected: {
				width: 0,
				height: 0,
			},
			size_on_screen: {
				width: 0,
				height: 0,
			},
		},
		weight: {
			current: 0,
			potential: 0,
		},
	},
	page: {
		id: 0,
		url: '',
		title: '',
	},
	edit_url: '',
	device_type: Math.random() > 0.5 ? 'phone' : 'desktop',
	instructions: '',
};

export const getPreloadingImages = ( count = 1 ) => {
	const images = [];
	for ( let i = 0; i < count; i++ ) {
		images.push( {
			...imageShape,
			id: `preloading-${ i }`,
		} );
	}
	return images;
};
