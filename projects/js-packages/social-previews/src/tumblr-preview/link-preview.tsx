import { __ } from '@wordpress/i18n';
import { baseDomain } from '../helpers';
import { MediaImage } from '../shared/media-image';
import { tumblrTitle } from './helpers';
import TumblrPostActions from './post/actions';
import TumblrPostHeader from './post/header';
import type { TumblrPreviewProps } from './types';

import './styles.scss';

export const TumblrLinkPreview: React.FC< TumblrPreviewProps > = ( {
	title,
	image,
	user,
	url,
	imageFocalPoint,
} ) => {
	return (
		<div className="tumblr-preview__post">
			<div className="tumblr-preview__card">
				<TumblrPostHeader user={ user } />
				<div className="tumblr-preview__window">
					{ image && (
						<div className="tumblr-preview__window-top">
							<MediaImage
								className="tumblr-preview__image"
								src={ image }
								alt={ __( 'Tumblr preview thumbnail', 'social-previews' ) }
								focalPoint={ imageFocalPoint }
							/>
							{ title && (
								<div className="tumblr-preview__overlay">
									<div className="tumblr-preview__overlay-title">{ tumblrTitle( title ) }</div>
								</div>
							) }
						</div>
					) }
					<div className={ `tumblr-preview__window-bottom ${ ! image ? 'is-full' : '' }` }>
						{ ! image && title && (
							<div className="tumblr-preview__window-title">{ tumblrTitle( title ) }</div>
						) }
						{ url && <div className="tumblr-preview__site-name">{ baseDomain( url ) }</div> }
					</div>
				</div>
				<TumblrPostActions />
			</div>
		</div>
	);
};
