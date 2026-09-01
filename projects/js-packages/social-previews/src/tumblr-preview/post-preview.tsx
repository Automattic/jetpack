import { __ } from '@wordpress/i18n';
import { AvatarWithFallback } from '../avatar-with-fallback';
import { preparePreviewText } from '../helpers';
import { ExpandableText } from '../shared/expandable-text';
import { MediaImage } from '../shared/media-image';
import { tumblrTitle, tumblrDescription } from './helpers';
import TumblrPostActions from './post/actions';
import TumblrPostHeader from './post/header';
import type { TumblrPreviewProps } from './types';
import './styles.scss';

export const TumblrPostPreview: React.FC< TumblrPreviewProps > = ( {
	title,
	description,
	image,
	user,
	url,
	media,
	hyperlinks,
	imageFocalPoint,
} ) => {
	const avatarUrl = user?.avatarUrl;

	const mediaItem = media?.[ 0 ];

	return (
		<div className="tumblr-preview__post">
			<AvatarWithFallback className="tumblr-preview__avatar" src={ avatarUrl } />
			<div className="tumblr-preview__card">
				<TumblrPostHeader user={ user } />
				<div className="tumblr-preview__body">
					{ title ? <div className="tumblr-preview__title">{ tumblrTitle( title ) }</div> : null }
					{ description && (
						<div className="tumblr-preview__description">
							<ExpandableText text={ description }>
								{ visibleText =>
									preparePreviewText( tumblrDescription( visibleText ), {
										platform: 'tumblr',
										hyperlinks,
									} )
								}
							</ExpandableText>
						</div>
					) }
					{ mediaItem ? (
						<div className="tumblr-preview__media-item">
							{ mediaItem.type.startsWith( 'video/' ) ? (
								<video controls className="tumblr-preview__media--video">
									<source src={ mediaItem.url } type={ mediaItem.type } />
								</video>
							) : (
								<img className="tumblr-preview__image" src={ mediaItem.url } alt="" />
							) }
						</div>
					) : (
						image && (
							<MediaImage
								className="tumblr-preview__image"
								src={ image }
								alt={ __( 'Tumblr preview thumbnail', 'social-previews' ) }
								focalPoint={ imageFocalPoint }
							/>
						)
					) }
					<a className="tumblr-preview__url" href={ url } target="_blank" rel="noreferrer">
						{ __( 'View On WordPress', 'social-previews' ) }
					</a>
				</div>
				<TumblrPostActions />
			</div>
		</div>
	);
};
