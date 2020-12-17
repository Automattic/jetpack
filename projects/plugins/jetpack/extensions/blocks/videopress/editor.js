/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { createBlobURL } from '@wordpress/blob';
import { createBlock } from '@wordpress/blocks';
import { mediaUpload } from '@wordpress/editor';
import { useBlockEditContext } from '@wordpress/block-editor';
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
import { isSimpleSite } from '../../shared/site-type-utils';
import withHasWarningIsInteractiveClassNames from '../../shared/with-has-warning-is-interactive-class-names';
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
					isSecondary
				>
					{ __( 'Media Library', 'jetpack' ) }
				</Button>

				<Button
					disabled={ true }
					className="components-button no-videopress-disabled-button"
					isSecondary
				>
					{ __( 'Upload', 'jetpack' ) }
				</Button>
			</OriginalPlaceholder>
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
	if ( isSimpleSite() && [ 'missing_plan', 'unknown' ].includes( unavailableReason ) ) {
		addFilter( 'editor.MediaPlaceholder', 'jetpack/videopress', videoPressNoPlanMediaPlaceholder );
		addFilter(
			'editor.BlockListBlock',
			`jetpack/videopress-with-has-warning-is-interactive-class-names`,
			withHasWarningIsInteractiveClassNames( `core/video` )
		);
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

			edit: withVideoPressEdit( edit ),

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

/**
 * Assign higher-than-default priority to make our modifications before the more generic
 * Gutenberg filters are run (that e.g. inject an extra `align` attribute based on the
 * corresponding `supports` field).
 *
 * @see packages/block-editor/src/hooks/align.js
 */
addFilter( 'blocks.registerBlockType', 'jetpack/videopress', addVideoPressSupport, 5 );
