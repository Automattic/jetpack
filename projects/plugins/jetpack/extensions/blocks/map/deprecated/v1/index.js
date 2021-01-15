/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * Internal dependencies
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
	showFullscreenButton: {
		type: 'boolean',
		default: true,
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
		return {
			...omit( oldAttributes, 'mapStyle' ),
			className,
		};
	},
	save,
};
