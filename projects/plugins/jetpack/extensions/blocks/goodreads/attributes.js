import { __ } from '@wordpress/i18n';

export default {
	bookNumber: {
		type: 'number',
		default: '5',
	},
	class: {
		type: 'string',
	},
	customTitle: {
		type: 'string',
		default: __( 'My Bookshelf', 'jetpack' ),
	},
	goodreadsId: {
		type: 'string',
	},
	id: {
		type: 'string',
	},
	link: {
		type: 'string',
	},
	orderOption: {
		type: 'string',
		default: 'a',
	},
	shelfOption: {
		type: 'string',
		default: 'read',
	},
	showAuthor: {
		type: 'boolean',
		default: true,
	},
	showCover: {
		type: 'boolean',
		default: true,
	},
	showRating: {
		type: 'boolean',
		default: true,
	},
	showReview: {
		type: 'boolean',
		default: false,
	},
	showTags: {
		type: 'boolean',
		default: false,
	},
	showTitle: {
		type: 'boolean',
		default: true,
	},
	sortOption: {
		type: 'string',
		default: 'date_added',
	},
	style: {
		type: 'string',
		default: 'default',
	},
	userInput: {
		type: 'string',
	},
	widgetId: {
		type: 'number',
	},
};
