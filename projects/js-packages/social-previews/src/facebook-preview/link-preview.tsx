import { __ } from '@wordpress/i18n';
import { TYPE_ARTICLE } from '../constants';
import { baseDomain } from '../helpers';
import CustomText from './custom-text';
import { facebookTitle } from './helpers';
import FacebookPostActions from './post/actions';
import FacebookPostHeader from './post/header';
import type { FacebookPreviewProps } from './types';

import './style.scss';

export type FacebookLinkPreviewProps = Omit< FacebookPreviewProps, 'imageMode' >;

export const FacebookLinkPreview: React.FC< FacebookLinkPreviewProps > = ( {
	url,
	title,
	image,
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
								<img src={ image } alt={ __( 'Facebook Preview Thumbnail', 'social-previews' ) } />
							) }
						</div>
					) }
					<div className="facebook-preview__text">
						<div className="facebook-preview__text-wrapper">
							<div className="facebook-preview__url">{ baseDomain( url ) }</div>
							<div className="facebook-preview__title">
								{ facebookTitle( title ) || baseDomain( url ) }
							</div>
						</div>
					</div>
				</div>
			</div>
			<FacebookPostActions />
		</div>
	);
};
