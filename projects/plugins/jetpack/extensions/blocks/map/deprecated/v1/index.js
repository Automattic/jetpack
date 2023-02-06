/**
 * This deprecation was needed as a showFullscreenButton attributes was
 * added to the block so this needs to be added with a default setting
 * of true to those blocks that don't currently have it set.
 *
 * The migration method also has to pull in the style changes from
 * deprecation V2 to remove the mapStyle attribute.
 */

import save from './save';

const attributes = {
	align: {
		type: 'string',
	},
	points: {
		type: 'array',
		default: [],
	},
	mapDetails: {
		type: 'boolean',
		default: true,
	},
	zoom: {
		type: 'integer',
		default: 13,
	},
	mapCenter: {
		type: 'object',
		default: {
			longitude: -122.41941550000001,
			latitude: 37.7749295,
		},
	},
	mapStyle: {
		type: 'string',
		default: 'default',
	},
	markerColor: {
		type: 'string',
		default: 'red',
	},
	preview: {
		type: 'boolean',
		default: false,
	},
	scrollToZoom: {
		type: 'boolean',
		default: false,
	},
	mapHeight: {
		type: 'integer',
	},
};

export default {
	attributes,
	migrate: oldAttributes => {
		// If the old block has classNames set, clean up any old "is-style-*" classes
		// that will clash with the new one we're adding.
		const className = (
			( oldAttributes.className || '' ).replace( /is-style-[^ ]+/, '' ) +
			` is-style-${ oldAttributes.mapStyle }`
		)
			.replace( /\s+/g, ' ' )
			.trim();
		const { mapStyle, ...newAttributes } = oldAttributes;
		return {
			...newAttributes,
			showFullscreenButton: true,
			className,
		};
	},
	save,
};
