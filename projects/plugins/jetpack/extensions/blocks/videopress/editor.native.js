import { Platform } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import deprecatedV3 from './deprecated/v3';
import deprecatedV4 from './deprecated/v4';
import withVideoPressEdit from './edit';
import withVideoPressSave from './save';

const addVideoPressSupport = ( settings, name ) => {
	// Bail if this is not the video block or if the hook has been triggered by a deprecation.
	if ( 'core/video' !== name || settings.isDeprecation ) {
		return settings;
	}

	const { deprecated, edit, save, supports } = settings;

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

	return Platform.select( {
		ios: {
			...settings,
			attributes: attributesDefinition,
			supports: {
				...supports,
				reusable: false,
			},
			edit: withVideoPressEdit( edit ),
			save: withVideoPressSave( save ),
			deprecated: [
				...( deprecated || [] ),
				deprecatedV4,
				deprecatedV3,
				{
					attributes: attributesDefinition,
					isEligible: attrs => ! attrs.guid,
					save,
					supports,
					isDeprecation: true,
				},
				deprecatedV2,
				deprecatedV1,
			],
		},
		// The VideoPress token fetch is not supported yet on Android.
		// So for now, we keep using the edit component of the core Video block.
		android: {
			...settings,
			attributes: attributesDefinition,
			save: withVideoPressSave( save ),
		},
	} );
};

addFilter(
	'blocks.registerBlockType',
	'gutenberg-mobile/add-videopress-support',
	addVideoPressSupport
);
