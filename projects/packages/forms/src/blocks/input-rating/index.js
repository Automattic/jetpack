const name = 'rating-input';

import edit from './edit';

const settings = {
	title: 'Rating input',
	description: 'Interactive star rating row.',
	parent: [ 'jetpack/field-rating' ],
	icon: 'star-filled',
	attributes: {
		max: { type: 'number', default: 5 },
		default: { type: 'number', default: 0 },
	},
	supports: { reusable: false, html: false },
	edit,
	save: () => null,
};

export default { name, settings };
