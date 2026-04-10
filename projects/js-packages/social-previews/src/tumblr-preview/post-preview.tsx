import { __ } from '@wordpress/i18n';
import { baseDomain, preparePreviewText } from '../helpers';
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
	cardTitle,
} ) => {
	const hasMedia = !! media?.length;

	return (
		<div className="tumblr-preview__post">
			<div className="tumblr-preview__card">
				<TumblrPostHeader user={ user } />
				<div className="tumblr-preview__body">
					{ title ? <div className="tumblr-preview__title">{ tumblrTitle( title ) }</div> : null }
					{ description && (
						<div className="tumblr-preview__description">
							{ preparePreviewText( tumblrDescription( description ), {
								platform: 'tumblr',
							} ) }
						</div>
					) }
					{ hasMedia ? (
						<>
							<div className="tumblr-preview__media-item">
								{ media[ 0 ].type.startsWith( 'video/' ) ? (
									<video controls>
										<source src={ media[ 0 ].url } type={ media[ 0 ].type } />
									</video>
								) : (
									<img
										className="tumblr-preview__image"
										src={ media[ 0 ].url }
										alt={ media[ 0 ].alt || '' }
									/>
								) }
							</div>
							{ url && (
								<div className="tumblr-preview__view-link">
									<a href={ url } target="_blank" rel="noreferrer">
										{ __( 'View On WordPress', 'social-previews' ) }
									</a>
								</div>
							) }
						</>
					) : (
						url && (
							<div className="tumblr-preview__window">
								{ image && (
									<div className="tumblr-preview__window-top">
										<img className="tumblr-preview__image" src={ image } alt="" />
										{ cardTitle && (
											<div className="tumblr-preview__overlay">
												<div className="tumblr-preview__overlay-title">
													{ tumblrTitle( cardTitle ) }
												</div>
											</div>
										) }
									</div>
								) }
								<div className={ `tumblr-preview__window-bottom ${ ! image ? 'is-full' : '' }` }>
									{ ! image && cardTitle && (
										<div className="tumblr-preview__window-title">{ tumblrTitle( cardTitle ) }</div>
									) }
									<div className="tumblr-preview__site-name">{ baseDomain( url ) }</div>
								</div>
							</div>
						)
					) }
				</div>
				<TumblrPostActions />
			</div>
		</div>
	);
};
