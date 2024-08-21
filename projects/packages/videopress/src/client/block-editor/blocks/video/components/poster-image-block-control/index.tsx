/**
 * WordPress dependencies
 */
import { MediaUploadCheck, MediaUpload } from '@wordpress/block-editor';
import { ToolbarButton, Dropdown, NavigableMenu, MenuItem } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { linkOff, image as imageIcon } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { VIDEO_POSTER_ALLOWED_MEDIA_TYPES } from '../../constants';
import './style.scss';
/**
 * Types
 */
import type { VideoPosterCardProps } from './types';
import type { AdminAjaxQueryAttachmentsResponseItemProps } from '../../../../../types';
import type { VideoControlProps } from '../../types';
import type React from 'react';

/**
 * Simple component that renders info about video poster.
 *
 * @param {VideoPosterCardProps} props - Component props.
 * @return {React.ReactElement}         VideoPosterCard component
 */
export function VideoPosterCard( { poster, className }: VideoPosterCardProps ): React.ReactElement {
	const notes = createInterpolateElement(
		__(
			'No custom Poster image selected.<help>You can upload or select an image from your media library to override the default video image.</help>',
			'jetpack-videopress-pkg'
		),
		{
			help: <p className="poster-panel-control__help" />,
		}
	);

	const overridingNotes = createInterpolateElement(
		__(
			'You are currently overriding the default Poster image.<help>Remove it if you want to use the default image generated by VideoPress.</help>',
			'jetpack-videopress-pkg'
		),
		{
			help: <p className="poster-panel-control__help" />,
		}
	);

	return <div className={ className }>{ poster ? overridingNotes : notes }</div>;
}

/**
 * Poster image control react component.
 *
 * @param {VideoControlProps} props - Component props.
 * @return {React.ReactElement}      PosterImageBlockControl block control
 */
export default function PosterImageBlockControl( {
	attributes,
	setAttributes,
	clientId,
}: VideoControlProps ): React.ReactElement {
	const { poster } = attributes;
	const onSelectPoster = ( image: AdminAjaxQueryAttachmentsResponseItemProps ) => {
		setAttributes( { poster: image.url } );
	};

	const onRemovePoster = () => {
		setAttributes( { poster: '' } );
	};

	return (
		<Dropdown
			contentClassName="dropdown-content"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<ToolbarButton
					label={ __( 'Poster image', 'jetpack-videopress-pkg' ) }
					showTooltip
					aria-expanded={ isOpen }
					aria-haspopup="true"
					onClick={ onToggle }
					icon={ imageIcon }
				/>
			) }
			renderContent={ ( { onClose } ) => {
				const videoPosterDescription = `video-block__poster-image-description-${ clientId }`;
				return (
					<>
						<NavigableMenu className="poster-image-block-control__wrapper">
							<MediaUploadCheck>
								<MediaUpload
									title={ __( 'Select Poster Image', 'jetpack-videopress-pkg' ) }
									onSelect={ ( image: AdminAjaxQueryAttachmentsResponseItemProps ) => {
										onSelectPoster( image );
										onClose();
									} }
									allowedTypes={ VIDEO_POSTER_ALLOWED_MEDIA_TYPES }
									render={ ( { open } ) => (
										<MenuItem
											icon={ imageIcon }
											onClick={ open }
											aria-describedby={ videoPosterDescription }
										>
											{ __( 'Open Media Library', 'jetpack-videopress-pkg' ) }
											<p id={ videoPosterDescription } hidden>
												{ poster
													? sprintf(
															/* translators: Placeholder is an image URL. */
															__( 'The current poster image url is %s', 'jetpack-videopress-pkg' ),
															poster
													  )
													: __(
															'There is no poster image currently selected',
															'jetpack-videopress-pkg'
													  ) }
											</p>
										</MenuItem>
									) }
								/>
							</MediaUploadCheck>

							<VideoPosterCard poster={ poster } className="current-media" />

							{ !! poster && (
								<MenuItem
									className="poster-image-block-control__remove-button"
									variant="tertiary"
									isDestructive
									onClick={ () => {
										onRemovePoster();
										onClose();
									} }
									icon={ linkOff }
								>
									{ __( 'Remove and use default', 'jetpack-videopress-pkg' ) }
								</MenuItem>
							) }
						</NavigableMenu>
					</>
				);
			} }
		/>
	);
}
