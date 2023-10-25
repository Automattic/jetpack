/**
 * External dependencies
 */
import analytics from '@automattic/jetpack-analytics';
import {
	isAtomicSite,
	isSimpleSite,
	getJetpackExtensionAvailability,
	withHasWarningIsInteractiveClassNames,
} from '@automattic/jetpack-shared-extension-utils';
import { createBlobURL } from '@wordpress/blob';
import { useBlockEditContext, store as blockEditorStore } from '@wordpress/block-editor';
import { parse } from '@wordpress/block-serialization-default-parser';
import { createBlock, getBlockType } from '@wordpress/blocks';
import { Button } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, select } from '@wordpress/data';
import { mediaUpload, store as editorStore } from '@wordpress/editor';
import { useContext, useEffect } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import { every } from 'lodash';
/**
 * Internal dependencies
 */
import { VideoPressBlockContext } from './components';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import deprecatedV3 from './deprecated/v3';
import deprecatedV4 from './deprecated/v4';
import withVideoPressEdit from './edit';
import withVideoPressSave from './save';
import { pickGUIDFromUrl, isVideoPressBlockBasedOnAttributes } from './utils';
import addV6TransformSupport from './v6-transform';
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
			attributes: {
				// Keep the original attributes to avoid breaking the block when its video is not a VideoPress video.
				...settings.attributes,
				...attributesDefinition,
			},

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

addFilter(
	'blocks.registerBlockType',
	'videopress/add-v6-transform-support',
	addV6TransformSupport
);

/**
 * Extend videopress/video transform to/from core/video block.
 *
 * @param {object} settings - Block settings.
 * @param {string} name     - Block name.
 * @returns {object} Modified block settings.
 */
function addVideoPressCoreVideoTransform( settings, name ) {
	// Apply only to videopress/video block.
	if ( name !== 'videopress/video' ) {
		return settings;
	}

	const isVideoPressVideoBlockRegistered = getBlockType( 'videopress/video' );
	const { available: isVideoPressVideoBlockAvailable } =
		getJetpackExtensionAvailability( 'videopress/video' );

	// If videopress/video block is not registered or not available, do not extend transforms.
	if ( ! isVideoPressVideoBlockRegistered || ! isVideoPressVideoBlockAvailable ) {
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
					isMatch: attrs => {
						const { src, guid } = attrs;
						const guidFromSrc = pickGUIDFromUrl( src );
						return guid || guidFromSrc;
					},
					transform: attrs => {
						const postId = select( editorStore ).getCurrentPostId();
						analytics?.tracks?.recordEvent(
							'jetpack_editor_videopress_block_manual_transform_click',
							{
								post_id: postId,
							}
						);
						return createBlock( 'videopress/video', attrs );
					},
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

function mapV6AttributesToV5( attributes ) {
	const newAttributes = { ...attributes };
	if ( attributes?.tracks ) {
		newAttributes.videoPressTracks = attributes.tracks;
		delete newAttributes.tracks;
	}

	if ( attributes?.isExample ) {
		newAttributes.isVideoPressExample = attributes.isExample;
		delete newAttributes.isExample;
	}

	if ( attributes?.classNames ) {
		newAttributes.videoPressClassNames = attributes.classNames;
		delete newAttributes.classNames;
	}

	// Clean the rest of the attributes.
	delete newAttributes.title;
	delete newAttributes.description;
	delete newAttributes.cacheHtml;
	delete newAttributes.videoRatio;
	delete newAttributes.privacySetting;
	delete newAttributes.allowDownload;
	delete newAttributes.displayEmbed;
	delete newAttributes.rating;
	delete newAttributes.isPrivate;

	return newAttributes;
}

/**
 * Convert video blocks to VideoPress video blocks,
 * when the app detects that the block is a VideoPress block instance.
 *
 * Blocks list:
 * - core/video
 * - core/embed is not auto-converted for the moment. @todo: consider to do it in the future.
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

		const { available: isVideoPressVideoBlockAvailable } =
			getJetpackExtensionAvailability( 'videopress/video' );

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

		// Note: conversion disabled for now.
		const shouldConvertCoreVideoToVideoPressVideoBlock = !! (
			isCoreVideoBlock && // Only auto-convert if the block is a core/video block
			isVideoPressVideoBlockRegistered && // Only auto-convert if the VideoPress block is registered
			isCoreVideoVideoPressBlock && // Only auto-convert if the block is a VideoPress block
			isVideoPressVideoBlockAvailable && // Only auto-convert if the feature is available
			isSimple && // Only auto-convert if the site is Simple
			// Disable auto-conversion for now.
			false
		);

		// Note: conversion disabled for now.
		const shouldConvertCoreEmbedToVideoPressVideoBlock = !! (
			isCoreEmbedBlock && // Only auto-convert if the block is a core/embed block
			isVideoPressVideoBlockRegistered && // Only auto-convert if the VideoPress block is registered
			isCoreEmbedVideoPressVariation && // Only auto-convert if the block is a embed VideoPress variation
			isVideoPressVideoBlockAvailable && // Only auto-convert if the feature is available
			isSimple && // Only auto-convert if the site is Simple
			// Disable auto-conversion for now.
			false
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

function ConvertV6toV5Effect( { BlockListBlock, ...props } ) {
	const { block } = props;
	const { name, attributes, clientId } = block;
	const { replaceBlock } = useDispatch( blockEditorStore );

	useEffect( () => {
		try {
			const parsedData = parse( attributes.originalContent );
			const originalBlock = parsedData?.[ 0 ];
			if ( ! originalBlock ) {
				return;
			}

			const { attrs } = originalBlock;
			replaceBlock( clientId, createBlock( 'core/video', mapV6AttributesToV5( attrs ) ) );
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.error( 'Error converting VideoPress block to core/video', e );
		}
	}, [ name, clientId, attributes, replaceBlock ] );

	return <BlockListBlock { ...props } />;
}

const convertV6toV5 = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { block } = props;
		const { name, attributes } = block;

		// CAUTION: code added before this line will be executed for all blocks
		// (also on typing), not just missing blocks.
		if ( name !== 'core/missing' || attributes?.originalName !== 'videopress/video' ) {
			return <BlockListBlock { ...props } />;
		}

		return <ConvertV6toV5Effect { ...props } BlockListBlock={ BlockListBlock } />;
	};
}, 'convertV6toV5' );

addFilter( 'editor.BlockListBlock', 'videopress/jetpack-convert-from-v6-to-v5', convertV6toV5 );
