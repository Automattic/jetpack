import { __ } from '@wordpress/i18n';
import { TYPE_ARTICLE } from '../constants';
import { baseDomain } from '../helpers';
import { MediaImage } from '../shared/media-image';
import CustomText from './custom-text';
import { facebookTitle, facebookDescription } from './helpers';
import FacebookPostActions from './post/actions';
import FacebookPostHeader from './post/header';
import type { FacebookPreviewProps } from './types';

import './style.scss';

// `imageMode` is still accepted so existing callers (the SEO front-page preview
// passes imageMode="landscape") keep working, but it is no longer read: Facebook's
// current link card is always landscape.
export type FacebookLinkPreviewProps = FacebookPreviewProps;

export const FacebookLinkPreview: React.FC< FacebookLinkPreviewProps > = ( {
	url,
	title,
	description,
	image,
	imageFocalPoint,
	user,
	customText,
	type,
} ) => {
	const isArticle = type === TYPE_ARTICLE;

	return (
		<div className="facebook-preview__post">
			<FacebookPostHeader user={ user } />
			<div className="facebook-preview__content">
				{ customText && <CustomText text={ customText } url={ url } /> }
				<div className="facebook-preview__body">
					{ ( image || isArticle ) && (
						<div className="facebook-preview__image is-landscape">
							{ image && (
								<MediaImage
									src={ image }
									alt={ __( 'Facebook Preview Thumbnail', 'social-previews' ) }
									focalPoint={ imageFocalPoint }
								/>
							) }
						</div>
					) }
					<div className="facebook-preview__text">
						<div className="facebook-preview__text-wrapper">
							<div className="facebook-preview__url">{ baseDomain( url ) }</div>
							<div className="facebook-preview__title">
								{ facebookTitle( title ) || baseDomain( url ) }
							</div>
							<div className="facebook-preview__description">
								{ description && facebookDescription( description ) }
								{ isArticle &&
									! description &&
									// translators: Default description for a Facebook post
									__( 'Visit the post for more.', 'social-previews' ) }
							</div>
						</div>
					</div>
				</div>
			</div>
			<FacebookPostActions />
		</div>
	);
};
