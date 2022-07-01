/**
 * WordPress dependencies
 */

import { MediaUploadCheck, BlockControls, MediaUpload } from '@wordpress/block-editor';
import { ToolbarButton, Dropdown, Button, BaseControl } from '@wordpress/components';
import { useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */

const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

export default function PosterImageBlockControl( { attributes, setAttributes, clientId } ) {
	const { poster } = attributes;
	const onSelectPoster = image => {
		setAttributes( { poster: image.url } );
	};

	const onRemovePoster = () => {
		setAttributes( { poster: '' } );

		// Move focus back to the Media Upload button.
		posterImageButton.current.focus();
	};

	const posterImageButton = useRef();

	return (
		<BlockControls group="block">
			<Dropdown
				renderToggle={ ( { isOpen, onToggle } ) => (
					<ToolbarButton
						label={ __( 'Poster image', 'jetpack' ) }
						showTooltip
						aria-expanded={ isOpen }
						aria-haspopup="true"
						onClick={ onToggle }
						//icon={ captionIcon }
					/>
				) }
				renderContent={ ( { onClose } ) => {
					const videoPosterDescription = `video-block__poster-image-description-${ clientId }`;
					return (
						<>
							<MediaUploadCheck>
								<BaseControl
									className="editor-video-poster-control"
									label={ __( 'Poster Image', 'jetpack' ) }
								>
									<MediaUpload
										title={ __( 'Select Poster Image', 'jetpack' ) }
										onSelect={ image => {
											onSelectPoster( image );
											onClose();
										} }
										allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
										render={ ( { open } ) => (
											<Button
												variant="secondary"
												onClick={ open }
												ref={ posterImageButton }
												aria-describedby={ videoPosterDescription }
											>
												{ ! poster
													? __( 'Select Poster Image', 'jetpack' )
													: __(
															'Replace image',
															'jetpack',
															/* dummy arg to avoid bad minification */ 0
													  ) }
											</Button>
										) }
									/>
									<p id={ videoPosterDescription } hidden>
										{ poster
											? sprintf(
													/* translators: Placeholder is an image URL. */
													__( 'The current poster image url is %s', 'jetpack' ),
													poster
											  )
											: __( 'There is no poster image currently selected', 'jetpack' ) }
									</p>
									{ !! poster && (
										<Button onClick={ onRemovePoster } variant="link" isDestructive>
											{ __( 'Remove Poster Image', 'jetpack' ) }
										</Button>
									) }
								</BaseControl>
							</MediaUploadCheck>
						</>
					);
				} }
			/>
		</BlockControls>
	);
}
