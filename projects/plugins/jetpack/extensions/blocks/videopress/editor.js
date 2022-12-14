import {
	isAtomicSite,
	isSimpleSite,
	getJetpackExtensionAvailability,
	withHasWarningIsInteractiveClassNames,
} from '@automattic/jetpack-shared-extension-utils';
import { createBlobURL } from '@wordpress/blob';
import { useBlockEditContext, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, getBlockType } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { mediaUpload } from '@wordpress/editor';
import { useContext, useEffect } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { every } from 'lodash';
import { VideoPressBlockContext } from './components';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import deprecatedV3 from './deprecated/v3';
import deprecatedV4 from './deprecated/v4';
import withVideoPressEdit from './edit';
import withVideoPressSave from './save';
import { pickGUIDFromUrl } from './utils';
import addVideoPressVideoChaptersSupport from './video-chapters';
import videoPressBlockExampleImage from './videopress-block-example-image.jpg';
import './editor.scss';

const videoPressNoPlanMediaPlaceholder = createHigherOrderComponent(
	OriginalPlaceholder => props => {
		const { name } = useBlockEditContext();
		if ( name !== 'core/video' ) {
			return <OriginalPlaceholder { ...props } />;
		}

		return (
			<OriginalPlaceholder
				{ ...props }
				disableDropZone={ true }
				className="no-videopress-media-placeholder"
			>
				<Button
					disabled={ true }
					className="components-button no-videopress-disabled-button"
					variant="secondary"
				>
					{ __( 'Media Library', 'jetpack' ) }
				</Button>

				<Button
					disabled={ true }
					className="components-button no-videopress-disabled-button"
					variant="secondary"
				>
					{ __( 'Upload', 'jetpack' ) }
				</Button>
			</OriginalPlaceholder>
		);
	},
	'videoPressNoPlanMediaPlaceholder'
);

const videoPressMediaPlaceholder = createHigherOrderComponent(
	OriginalPlaceholder => props => {
		const { name } = useBlockEditContext();
		if ( name !== 'core/video' ) {
			return <OriginalPlaceholder { ...props } />;
		}

		const { onFilesSelected, onMediaItemSelected } = useContext( VideoPressBlockContext );

		// We will handle video uploads
		const newProps = {
			...props,
			handleUpload: false,
			disableDropZone: true,
			onSelect: selected => {
				if ( undefined !== selected.length ) {
					// Browser file upload
					onFilesSelected( selected );
				} else {
					// WP Media Library item selected
					onMediaItemSelected( selected );
				}
			},
		};

		return (
			<OriginalPlaceholder
				{ ...newProps }
				className="videopress-media-placeholder"
			></OriginalPlaceholder>
		);
	},
	'videoPressMediaPlaceholder'
);

/**
 * Gutenberg introduced a change that causes a `wp-block-video` class to be
 * applied to the block via the `blocks.getSaveContent.extraProps` hook. This
 * results in all prior deprecations being unable to generate what was
 * previously valid content.
 *
 * This filter removes that introduced class so the deprecations can produce
 * content that matches the originally saved post content and successfully
 * migrate deprecated blocks to the current version.
 *
 * @param   {object} props      - Additional props applied to the save element.
 * @param   {object} blockType  - Block type definition.
 * @param   {object} attributes - Block's attributes.
 * @returns {object}            - Filtered props applied to the save element.
 */
const preventBlockClassOnDeprecations = ( props, blockType, attributes ) => {
	// Skip manipulating the block's className prop if:
	// - Not a video block
	// - Is a placeholder video block ( no guid )
	// - Already has wp-block-video CSS class ( block was added after Gutenberg change )
	// - Block has been migrated ( previous bug meant videoPressClassNames was undefined )
	if (
		blockType.name !== 'core/video' ||
		! attributes.guid ||
		attributes.className?.indexOf( 'wp-block-video' ) >= 0 ||
		attributes.videoPressClassNames
	) {
		return props;
	}

	// Prevent `wp-block-video` class being applied.
	props.className = props.className.replace( 'wp-block-video', '' ).trim();

	return props;
};

// Override the core/embed block to add support for v.wordpress.com URLs and hide the "videopress" embed
// block from the selectable block if VideoPress is enabled.
const addCoreEmbedOverride = settings => {
	if ( ! ( 'variations' in settings ) || 'object' !== typeof settings.variations ) {
		return;
	}

	const { available } = getJetpackExtensionAvailability( 'videopress' );

	settings.variations.some( variation => {
		if ( 'videopress' === variation.name ) {
			// If VideoPress is available, hide the core VideoPress embed blocks.
			if ( available ) {
				variation.scope = [];
			}
			// Add support for old v.wordpress.com URLs
			variation.patterns.push( /^https?:\/\/v\.wordpress\.com\/([a-zA-Z\d]{8})(.+)?$/i );
			return true;
		}
		return false;
	} );
};

const addVideoPressSupport = ( settings, name ) => {
	if ( 'core/embed' === name ) {
		addCoreEmbedOverride( settings );
		return settings;
	}

	// Bail if this is not the video block or if the hook has been triggered by a deprecation.
	if ( 'core/video' !== name || settings.isDeprecation ) {
		return settings;
	}

	const { deprecated, edit, save, supports, transforms } = settings;
	const { available, unavailableReason } = getJetpackExtensionAvailability( 'videopress' );
	const isNotAvailable =
		( isSimpleSite() || isAtomicSite() ) &&
		[ 'missing_plan', 'unknown' ].includes( unavailableReason );

	const resumableUploadEnabled = !! window.videoPressResumableEnabled;

	// Check if VideoPress is unavailable and filter the mediaplaceholder to limit options
	if ( isNotAvailable ) {
		addFilter( 'editor.MediaPlaceholder', 'jetpack/videopress', videoPressNoPlanMediaPlaceholder );
		addFilter(
			'editor.BlockListBlock',
			`jetpack/videopress-with-has-warning-is-interactive-class-names`,
			withHasWarningIsInteractiveClassNames( `core/video` )
		);
	} else if ( available ) {
		if ( resumableUploadEnabled ) {
			addFilter( 'editor.MediaPlaceholder', 'jetpack/videopress', videoPressMediaPlaceholder );
		}
		// If VideoPress is available, we update the block description and example with VideoPress-specific content.
		settings.description = __(
			'Embed a video from your media library or upload a new one with VideoPress.',
			'jetpack'
		);
		settings.example.attributes = {
			caption: '',
			isVideoPressExample: true,
			src: videoPressBlockExampleImage,
		};
	}

	addFilter(
		'blocks.getSaveContent.extraProps',
		'jetpack/videopress',
		preventBlockClassOnDeprecations,
		20
	);

	// We customize the video block even if VideoPress it not available so we can support videos that were uploaded to
	// VideoPress if it was available in the past (i.e. before a plan downgrade).
	if (
		available ||
		[ 'missing_plan', 'missing_module', 'unknown' ].includes( unavailableReason )
	) {
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

		const oldVideoEmbedRegex = /https?:\/\/v\.wordpress\.com\/([a-zA-Z\d]{8})(.+)?/i;

		return {
			...settings,
			attributes: attributesDefinition,

			transforms: {
				...transforms,
				from: [
					{
						type: 'files',
						isMatch: files => every( files, file => file.type.indexOf( 'video/' ) === 0 ),
						// We define a higher priority (lower number) than the default of 10. This ensures that this
						// transformation prevails over the core video block default transformations.
						priority: 9,
						transform: ( files, onChange ) => {
							const blocks = [];
							files.forEach( file => {
								if ( available && resumableUploadEnabled ) {
									// VideoPress block handles the upload
									const block = createBlock( 'core/video', {
										fileForImmediateUpload: file,
									} );

									blocks.push( block );
								} else {
									// Use core block w/ standard mediaUpload
									const block = createBlock( 'core/video', {
										src: createBlobURL( file ),
									} );

									mediaUpload( {
										filesList: [ file ],
										onFileChange: ( [ { id, url } ] ) => {
											onChange( block.clientId, { id, src: url } );
										},
										allowedTypes: [ 'video' ],
									} );

									blocks.push( block );
								}
							} );
							return blocks;
						},
					},
					// Transform old v.wordpress.com classic block embeds to videopress.com/v/ embed
					{
						type: 'raw',
						isMatch: node => {
							return node.nodeName === 'P' && oldVideoEmbedRegex.test( node.innerHTML );
						},
						transform: node => {
							const matches = oldVideoEmbedRegex.exec( node.innerHTML );
							return createBlock( 'core/embed', {
								url: 'https://videopress.com/v/' + matches[ 1 ].trim(),
							} );
						},
					},
				],
			},

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
		};
	}

	return settings;
};

/**
 * Assign higher-than-default priority to make our modifications before the more generic
 * Gutenberg filters are run (that e.g. inject an extra `align` attribute based on the
 * corresponding `supports` field).
 *
 * @see packages/block-editor/src/hooks/align.js
 */
addFilter( 'blocks.registerBlockType', 'jetpack/videopress', addVideoPressSupport, 5 );

addFilter(
	'blocks.registerBlockType',
	'videopress/add-wp-chapters-support',
	addVideoPressVideoChaptersSupport
);

/**
 * Extend videopress/video transform to/from core/video block.
 *
 * @param {object} settings - Block settings.
 * @param {string} name     - Block name.
 * @returns {object} Modified block settings.
 */
function addVideoPressCoreVideoTransform( settings, name ) {
	const isVideoPressVideoBlockRegistered = getBlockType( 'videopress/video' );
	const { available: isVideoPressVideoBlockAvailable } = getJetpackExtensionAvailability(
		'videopress/video'
	);

	if ( isVideoPressVideoBlockRegistered && isVideoPressVideoBlockAvailable && isSimpleSite() ) {
		return settings;
	}

	if ( name !== 'videopress/video' ) {
		return settings;
	}

	return {
		...settings,
		transforms: {
			from: [
				...( settings.transforms?.from || [] ),
				{
					type: 'block',
					blocks: [ 'core/video' ],
					transform: attrs => createBlock( 'videopress/video', attrs ),
				},
			],
			to: [
				...( settings.transforms?.to || [] ),
				{
					type: 'block',
					blocks: [ 'core/video' ],
					transform: attrs => createBlock( 'core/video', attrs ),
				},
			],
		},
	};
}

addFilter(
	'blocks.registerBlockType',
	'videopress/add-core-video-transform',
	addVideoPressCoreVideoTransform
);

/**
 * Organize the block attributes for the new videopress/video block
 *
 * @param {object} attributes        - core/video block attributes
 * @param {object} defaultAttributes - default core/video block attributes
 * @returns {object}                   The new attributes
 */
function getVideoPressVideoBlockAttributes( attributes, defaultAttributes ) {
	const attrs = attributes || defaultAttributes;

	// Update attributes names to match the new VideoPress Video block.
	if ( attrs?.videoPressTracks ) {
		attrs.tracks = attrs.videoPressTracks || [];
		delete attrs.videoPressTracks;
	}

	if ( attrs?.isVideoPressExample ) {
		attrs.isExample = attrs.isVideoPressExample || [];
		delete attrs.isVideoPressExample;
	}

	return attrs;
}

/**
 * Check whether the block is a VideoPress block instance,
 * based on the passed attributes.
 *
 * @param {object} attributes - Block attributes.
 * @returns {boolean} 	        Whether the block is a VideoPress block instance.
 */
const isVideoPressBlockBasedOnAttributes = attributes => {
	const { guid, videoPressTracks, isVideoPressExample } = attributes;

	// VideoPress block should have a guid attribute.
	if ( ! guid?.length ) {
		return false;
	}

	// VideoPress block should have a videoPressTracks array attribute.
	if ( ! Array.isArray( videoPressTracks ) ) {
		return false;
	}

	// VideoPress block should have a isVideoPressExample boolean attribute.
	const attrNames = Object.keys( attributes );
	if ( ! attrNames.includes( 'isVideoPressExample' ) || typeof isVideoPressExample !== 'boolean' ) {
		return false;
	}

	return true;
};

/**
 * Convert some video blocks to VideoPress video blocks,
 * when the app detects that the block is a VideoPress block instance.
 *
 * Blocks list:
 * - core/video
 * - core/embed
 */
const convertVideoBlockToVideoPressVideoBlock = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { block } = props;
		const { name, attributes, clientId, __unstableBlockSource } = block;
		const { replaceBlock } = useDispatch( blockEditorStore );
		const { url, guid: guidAttr, providerNameSlug } = attributes;

		/*
		 * We try to recognize core/video Jetpack VideoPress block,
		 * based on some of its attributes.
		 */
		const isCoreVideoVideoPressBlock = isVideoPressBlockBasedOnAttributes( attributes );

		const isVideoPressVideoBlockRegistered = getBlockType( 'videopress/video' );

		const { available: isVideoPressVideoBlockAvailable } = getJetpackExtensionAvailability(
			'videopress/video'
		);

		const isCoreVideoBlock = name === 'core/video';

		const isCoreEmbedBlock = name === 'core/embed';
		const guidFromUrl = pickGUIDFromUrl( url );

		const isCoreEmbedVideoPressVariation = providerNameSlug === 'videopress' && !! guidFromUrl;

		/*
		 * GUID can come `guid` attribute (for core/video)
		 * or from the `url` attribute (for core/embed)
		 */
		const guid = isCoreEmbedBlock && guidFromUrl ? guidFromUrl : guidAttr;

		const isSimple = isSimpleSite();

		const shouldConvertCoreVideoToVideoPressVideoBlock = !! (
			isCoreVideoBlock && // Only auto-convert if the block is a core/video block
			isVideoPressVideoBlockRegistered && // Only auto-convert if the VideoPress block is registered
			isCoreVideoVideoPressBlock && // Only auto-convert if the block is a VideoPress block
			isVideoPressVideoBlockAvailable && // Only auto-convert if the feature is available
			// Only auto-convert if the site is Simple
			isSimple
		);

		const shouldConvertCoreEmbedToVideoPressVideoBlock = !! (
			isCoreEmbedBlock && // Only auto-convert if the block is a core/embed block
			isVideoPressVideoBlockRegistered && // Only auto-convert if the VideoPress block is registered
			isCoreEmbedVideoPressVariation && // Only auto-convert if the block is a embed VideoPress variation
			isVideoPressVideoBlockAvailable && // Only auto-convert if the feature is available
			// Only auto-convert if the site is Simple
			isSimple
		);

		const shouldConvertToVideoPressVideoBlock =
			shouldConvertCoreVideoToVideoPressVideoBlock || shouldConvertCoreEmbedToVideoPressVideoBlock;

		// clean oEmbed class attribute since it's not needed for v6
		if ( shouldConvertCoreEmbedToVideoPressVideoBlock && attributes.className ) {
			delete attributes.className;
		}

		useEffect( () => {
			if ( ! shouldConvertToVideoPressVideoBlock ) {
				return;
			}

			replaceBlock(
				clientId,
				createBlock(
					'videopress/video',
					getVideoPressVideoBlockAttributes( __unstableBlockSource?.attrs, { ...attributes, guid } )
				)
			);
		}, [
			clientId,
			shouldConvertToVideoPressVideoBlock,
			attributes,
			__unstableBlockSource,
			replaceBlock,
			guid,
		] );

		return <BlockListBlock { ...props } />;
	};
}, 'convertVideoBlockToVideoPressVideoBlock' );

addFilter(
	'editor.BlockListBlock',
	'videopress/jetpack-convert-to-videopress-video-block',
	convertVideoBlockToVideoPressVideoBlock
);
