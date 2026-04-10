import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { AvatarWithFallback } from '../avatar-with-fallback';
import { preparePreviewText } from '../helpers';
import { FEED_TEXT_MAX_LENGTH } from './constants';
import { Bookmark as BookmarkIcon } from './icons/bookmark';
import { Comment as CommentIcon } from './icons/comment';
import { Heart as HeartIcon } from './icons/heart';
import { Menu as MenuIcon } from './icons/menu';
import { Repost as RepostIcon } from './icons/repost';
import { Share as ShareIcon } from './icons/share';
import { InstagramPreviewProps } from './types';
import './style.scss';

// Instagram clamps aspect ratios between 1.91:1 (landscape) and 4:5 (portrait).
const MIN_RATIO = 4 / 5; // 0.8 (tallest allowed)
const MAX_RATIO = 1.91; // widest allowed

/**
 * Detects the image's natural aspect ratio and clamps it to Instagram's
 * supported range. Hides the media container until the ratio is known
 * to prevent layout reflow.
 */
function useInstagramAspectRatio() {
	const [ aspectRatio, setAspectRatio ] = useState< number | undefined >();
	const [ isLoading, setIsLoading ] = useState( true );

	const onLoad = useCallback( ( e: React.SyntheticEvent< HTMLImageElement > ) => {
		const img = e.currentTarget;
		const natural = img.naturalWidth / img.naturalHeight;
		setAspectRatio( Math.max( MIN_RATIO, Math.min( MAX_RATIO, natural ) ) );
		setIsLoading( false );
	}, [] );

	const onError = useCallback( () => {
		setIsLoading( false );
	}, [] );

	return { aspectRatio, isLoading, imgProps: { onLoad, onError } };
}

/**
 * Instagram Post Preview Component
 *
 * @param {InstagramPreviewProps} props - The props for the Instagram post preview.
 *
 * @return  The Instagram post preview component.
 */
export function InstagramPostPreview( {
	image,
	media,
	name,
	profileImage,
	caption,
	url,
}: InstagramPreviewProps ) {
	const username = name || 'username';
	const mediaItem = media?.[ 0 ];
	const { aspectRatio, isLoading, imgProps } = useInstagramAspectRatio();

	const mediaStyle = aspectRatio ? { aspectRatio: `${ aspectRatio }` } : undefined;

	return (
		<div className="instagram-preview__wrapper">
			<section className="instagram-preview__container">
				<div className="instagram-preview__header">
					<div className="instagram-preview__header--avatar">
						<AvatarWithFallback src={ profileImage } />
					</div>
					<div className="instagram-preview__header--profile">
						<div className="instagram-preview__header--profile-name">{ username }</div>
						<div className="instagram-preview__header--profile-menu">
							<MenuIcon />
						</div>
					</div>
				</div>
				<div
					className={ `instagram-preview__media ${ isLoading ? 'is-loading' : '' }` }
					style={ mediaStyle }
				>
					{ mediaItem ? (
						<div className="instagram-preview__media-item">
							{ mediaItem.type.startsWith( 'video/' ) ? (
								<video controls={ false } className="instagram-preview__media--video">
									<source src={ mediaItem.url } type={ mediaItem.type } />
								</video>
							) : (
								<img
									className="instagram-preview__media--image"
									src={ mediaItem.url }
									alt=""
									{ ...imgProps }
								/>
							) }
						</div>
					) : (
						<img
							className="instagram-preview__media--image"
							src={ image }
							alt=""
							{ ...imgProps }
						/>
					) }
				</div>
				<div className="instagram-preview__content">
					<section className="instagram-preview__content--actions">
						<div className="instagram-preview__content--actions-primary">
							<HeartIcon />
							<CommentIcon />
							<RepostIcon />
							<ShareIcon />
						</div>
						<div className="instagram-preview__content--actions-secondary">
							<BookmarkIcon />
						</div>
					</section>
					<div className="instagram-preview__content--body">
						<div className="instagram-preview__content--name">{ username }</div>
						&nbsp;
						{ caption ? (
							<div className="instagram-preview__content--text">
								{ preparePreviewText( caption, {
									platform: 'instagram',
									maxChars: FEED_TEXT_MAX_LENGTH,
								} ) }
								{ media && url && (
									<>
										<br />
										<br />
										{ url }
									</>
								) }
							</div>
						) : null }
					</div>
					<div className="instagram-preview__content--footer">
						<span>{ __( 'View one comment', 'social-previews' ) }</span>
					</div>
				</div>
			</section>
		</div>
	);
}
