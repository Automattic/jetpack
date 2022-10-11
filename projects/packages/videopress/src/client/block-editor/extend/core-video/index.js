/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import deprecatedV3 from './deprecated/v3';
import deprecatedV4 from './deprecated/v4';

const handleJetpackCoreVideoBlock = ( settings, name ) => {
	if ( name !== 'core/video' ) {
		return settings;
	}

	const jetpackCoreVideoBlockAttributes = {
		autoplay: {
			type: 'boolean',
		},
		caption: {
			type: 'string',
			source: 'html',
			selector: 'figcaption',
		},
		controls: {
			type: 'boolean',
			default: true,
		},
		maxWidth: {
			type: 'string',
			default: '100%',
		},
		guid: {
			type: 'string',
		},
		id: {
			type: 'number',
		},
		loop: {
			type: 'boolean',
		},
		isVideoPressExample: {
			type: 'boolean',
			default: false,
		},
		muted: {
			type: 'boolean',
		},
		playsinline: {
			type: 'boolean',
		},
		poster: {
			type: 'string',
		},
		preload: {
			type: 'string',
			default: 'metadata',
		},
		seekbarPlayedColor: {
			type: 'string',
			default: '',
		},
		seekbarLoadingColor: {
			type: 'string',
			default: '',
		},
		seekbarColor: {
			type: 'string',
			default: '',
		},
		src: {
			type: 'string',
			source: 'attribute',
			selector: 'video',
			attribute: 'src',
		},
		useAverageColor: {
			type: 'boolean',
			default: true,
		},
		videoPressTracks: {
			type: 'array',
			items: {
				type: 'object',
			},
			default: [],
		},
		videoPressClassNames: {
			type: 'string',
		},
		fileForImmediateUpload: {
			type: 'object',
			default: null,
		},
	};

	return {
		...settings,
		attributes: {
			...settings.attributes,
			...jetpackCoreVideoBlockAttributes,
		},
		deprecated: [
			...( settings.deprecated || [] ),
			deprecatedV4,
			deprecatedV3,
			deprecatedV2,
			deprecatedV1,
		],
	};
};

addFilter(
	'blocks.registerBlockType',
	'videopress/core-video/handle-block-deprecation',
	handleJetpackCoreVideoBlock
);
