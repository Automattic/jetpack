import { addFilter } from '@wordpress/hooks';
import withVideoPressSave from './save';

const addVideoPressSupport = ( settings, name ) => {
	// Bail if this is not the video block or if the hook has been triggered by a deprecation.
	if ( 'core/video' !== name || settings.isDeprecation ) {
		return settings;
	}

	const { save } = settings;

	const attributesDefinition = {
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
		original: {
			type: 'string',
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
		attributes: attributesDefinition,
		save: withVideoPressSave( save ),
	};
};

addFilter(
	'blocks.registerBlockType',
	'gutenberg-mobile/add-videopress-support',
	addVideoPressSupport
);
