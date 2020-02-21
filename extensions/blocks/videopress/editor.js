/**
 * External dependencies
 */
import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';
import { mediaUpload } from '@wordpress/editor';
import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { every } from 'lodash';

/**
 * Internal dependencies
 */
import withVideoPressEdit from './edit';
import withVideoPressSave from './save';
import getJetpackExtensionAvailability from '../../shared/get-jetpack-extension-availability';
import deprecatedV1 from './deprecated/v1';
import wrapPaidBlock from '../../shared/wrap-paid-block';
import './editor.scss';

const videoPressNoPlanMediaPlaceholder = createHigherOrderComponent(
	OriginalPlaceholder => props => {
		return (
			<OriginalPlaceholder
				{ ...props }
				disableDropZone={ true }
				className="no-videopress-media-placeholder"
				labels={ {
					instructions: __(
						'Insert a video from a URL. To upload a video file please purchase a paid plan using the upgrade button above.',
						'jetpack'
					),
				} }
			/>
		);
	},
	'videoPressNoPlanMediaPlaceholder'
);

const addVideoPressSupport = ( settings, name ) => {
	// Bail if this is not the video block or if the hook has been triggered by a deprecation.
	if ( 'core/video' !== name || settings.isDeprecation ) {
		return settings;
	}

	const { attributes, deprecated, edit, save, supports, transforms } = settings;
	const { available, unavailableReason } = getJetpackExtensionAvailability( 'videopress' );

	// Check if VideoPress is unavailable and filter the mediaplaceholder to limit options
	if ( [ 'missing_plan', 'unknown' ].includes( unavailableReason ) ) {
		addFilter( 'editor.MediaPlaceholder', 'jetpack/videopress', videoPressNoPlanMediaPlaceholder );
	}

	// We customize the video block even if VideoPress it not available so we can support videos that were uploaded to
	// VideoPress if it was available in the past (i.e. before a plan downgrade).
	if (
		available ||
		[ 'missing_plan', 'missing_module', 'unknown' ].includes( unavailableReason )
	) {
		return {
			...settings,

			attributes: {
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
				guid: {
					type: 'string',
				},
				id: {
					type: 'number',
				},
				loop: {
					type: 'boolean',
				},
				muted: {
					type: 'boolean',
				},
				playsInline: {
					type: 'boolean',
				},
				poster: {
					type: 'string',
				},
				preload: {
					type: 'string',
					default: 'metadata',
				},
				src: {
					type: 'string',
				},
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
							} );
							return blocks;
						},
					},
				],
			},

			supports: {
				...supports,
				reusable: false,
			},

			edit: [ 'missing_plan', 'unknown' ].includes( unavailableReason )
				? wrapPaidBlock( {
						requiredPlan: 'value_bundle',
						customTitle: {
							knownPlan: __( 'Upgrade to %(planName)s to upload videos.', 'jetpack' ),
							unknownPlan: __( 'Upgrade to a paid plan to upload videos.', 'jetpack' ),
						},
						customSubTitle: __(
							'Upload unlimited videos to your website and \
						display them using a fast, unbranded, \
						customizable player.',
							'jetpack'
						),
				  } )( withVideoPressEdit( edit ) )
				: withVideoPressEdit( edit ),

			save: withVideoPressSave( save ),

			deprecated: [
				...( deprecated || [] ),
				{
					attributes,
					isEligible: attrs => ! attrs.guid,
					save,
					supports,
					isDeprecation: true,
				},
				deprecatedV1,
			],
		};
	}

	return settings;
};

addFilter( 'blocks.registerBlockType', 'jetpack/videopress', addVideoPressSupport );
