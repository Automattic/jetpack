/**
 * WordPress dependencies
 */
import { InspectorControls } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { dispatch } from '@wordpress/data';
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VIDEO_PRIVACY } from '../../blocks/videopress/constants';
import { getVideoPressUrl } from '../../blocks/videopress/url';
import { pickGUIDFromUrl } from '../../blocks/videopress/utils';

// Add VideoPress settings to the embed block's edit component
export const withVideoPressSettings = createHigherOrderComponent( BlockEdit => {
	return props => {
		const { name, attributes, isSelected } = props;

		// Only add settings to VideoPress embed blocks
		if ( name !== 'core/embed' ) {
			return <BlockEdit { ...props } />;
		}

		// Check if this is a VideoPress URL or embed
		const isVideoPress =
			// Check URL patterns
			attributes?.url?.match(
				/^https?:\/\/(?:video\.wordpress\.com\/[ve]\/|videopress\.com\/[ve]\/)[a-zA-Z\d]{8}/
			) ||
			// Check provider name
			attributes?.providerNameSlug === 'videopress';

		if ( ! isVideoPress ) {
			return <BlockEdit { ...props } />;
		}

		const { replaceBlock } = dispatch( 'core/block-editor' );

		const handleTransform = () => {
			// Extract the video URL and GUID
			const videoUrl = attributes.url;
			const guid = attributes.guid || pickGUIDFromUrl( videoUrl );

			// Create the VideoPress block with all required attributes
			const videoPressBlock = createBlock( 'videopress/video', {
				// Core video attributes
				src: videoUrl,
				id: attributes.id || null,
				guid: guid,
				title: attributes.title || '',
				caption: attributes.caption || '',

				// VideoPress specific attributes
				isVideoPressExample: false,
				autoplay: false,
				controls: true,
				muted: false,
				playsinline: true,
				preload: 'metadata',
				useAverageColor: true,
				poster: attributes.poster || '',
				loop: false,
				videoPressTracks: [],
				className: attributes.className || '',
				align: attributes.align || '',
				rating: '',
				allowDownload: false,
				privacySetting: VIDEO_PRIVACY.SITE_DEFAULT,

				// Add preview-specific attributes
				url: getVideoPressUrl( guid, {
					autoplay: false,
					controls: true,
					loop: false,
					muted: false,
					playsinline: true,
					poster: attributes.poster || '',
					preload: 'metadata',
					useAverageColor: true,
				} ),
			} );

			// Replace the current block with the VideoPress block
			replaceBlock( props.clientId, videoPressBlock );
		};

		return (
			<>
				<BlockEdit { ...props } />
				{ isSelected && (
					<InspectorControls>
						<div className="wp-block-videopress-video-transform" style={ { padding: '16px' } }>
							<div className="components-notice is-info">
								<div className="components-notice__content">
									{ __(
										"You can transform this post's video blocks to the new VideoPress block to take advantage of new features.",
										'jetpack'
									) }
								</div>
							</div>
							<div style={ { marginTop: '8px' } }>
								<button className="components-button is-primary" onClick={ handleTransform }>
									{ __( 'Transform to VideoPress block', 'jetpack' ) }
								</button>
							</div>
						</div>
					</InspectorControls>
				) }
			</>
		);
	};
}, 'withVideoPressSettings' );

// Add the settings panel
addFilter( 'editor.BlockEdit', 'jetpack/videopress-embed-settings', withVideoPressSettings );
