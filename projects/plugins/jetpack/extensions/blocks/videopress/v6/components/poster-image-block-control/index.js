/**
 * WordPress dependencies
 */
import { MediaUploadCheck, BlockControls, MediaUpload } from '@wordpress/block-editor';
import { ToolbarButton, Dropdown, NavigableMenu, MenuItem } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { linkOff, media as mediaIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';

const VIDEO_POSTER_ALLOWED_MEDIA_TYPES = [ 'image' ];

export default function PosterImageBlockControl( { attributes, setAttributes, clientId } ) {
	const { poster } = attributes;
	const onSelectPoster = image => {
		setAttributes( { poster: image.url } );
	};

	const onRemovePoster = () => {
		setAttributes( { poster: '' } );
	};

	const currentImage = () => {
		if ( poster ) {
			return (
				<>
					<span>{ __( 'Current Image:', 'jetpack' ) }</span>
					<img src={ poster } alt="" />
				</>
			);
		}
		return (
			<>
				{ __(
					'No custom Poster image selected. You can upload or select an image from your media library to override the default video image',
					'jetpack'
				) }
			</>
		);
	};

	return (
		<BlockControls group="block">
			<Dropdown
				contentClassName={ styles.dropdown_content }
				renderToggle={ ( { isOpen, onToggle } ) => (
					<ToolbarButton
						label={ __( 'Poster image', 'jetpack' ) }
						showTooltip
						aria-expanded={ isOpen }
						aria-haspopup="true"
						onClick={ onToggle }
						icon={ mediaIcon }
					/>
				) }
				renderContent={ ( { onClose } ) => {
					const videoPosterDescription = `video-block__poster-image-description-${ clientId }`;
					return (
						<>
							<NavigableMenu className="block-editor-media-replace-flow__media-upload-menu">
								<MediaUploadCheck>
									<MediaUpload
										title={ __( 'Select Poster Image', 'jetpack' ) }
										onSelect={ image => {
											onSelectPoster( image );
											onClose();
										} }
										allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
										render={ ( { open } ) => (
											<MenuItem
												icon={ mediaIcon }
												onClick={ open }
												aria-describedby={ videoPosterDescription }
											>
												{ ! poster
													? __( 'Select Poster Image', 'jetpack' )
													: __(
															'Replace Poster image',
															'jetpack',
															/* dummy arg to avoid bad minification */ 0
													  ) }
												<p id={ videoPosterDescription } hidden>
													{ poster
														? sprintf(
																/* translators: Placeholder is an image URL. */
																__( 'The current poster image url is %s', 'jetpack' ),
																poster
														  )
														: __( 'There is no poster image currently selected', 'jetpack' ) }
												</p>
											</MenuItem>
										) }
									/>
								</MediaUploadCheck>

								{ !! poster && (
									<MenuItem
										onClick={ () => {
											onRemovePoster();
											onClose();
										} }
										isDestructive
										icon={ linkOff }
									>
										{ __( 'Remove and use default', 'jetpack' ) }
									</MenuItem>
								) }
							</NavigableMenu>

							<div className={ styles.current_media }>{ currentImage() }</div>
						</>
					);
				} }
			/>
		</BlockControls>
	);
}
