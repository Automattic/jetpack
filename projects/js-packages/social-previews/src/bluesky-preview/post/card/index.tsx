import { baseDomain, getTitleFromDescription, stripHtmlTags } from '../../../helpers';
import { MediaImage } from '../../../shared/media-image';
import { blueskyTitle } from '../../helpers';
import { BlueskyPreviewProps } from '../../types';

import './styles.scss';

const BlueskyPostCard: React.FC< BlueskyPreviewProps > = ( {
	title,
	description,
	url,
	image,
	imageFocalPoint,
} ) => {
	return (
		<div className="bluesky-preview__card">
			{ image ? (
				<div className="bluesky-preview__card-image">
					<MediaImage src={ image } alt="" focalPoint={ imageFocalPoint } />
				</div>
			) : null }
			<div className="bluesky-preview__card-text">
				<div className="bluesky-preview__card-title">
					{ blueskyTitle( title ) || getTitleFromDescription( description ) }
				</div>
				{ description && (
					<div className="bluesky-preview__card-description">{ stripHtmlTags( description ) }</div>
				) }
			</div>
			<div className="bluesky-preview__card-domain">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					width="14"
					height="14"
					aria-hidden="true"
				>
					<circle cx="12" cy="12" r="10" />
					<path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
				</svg>
				<span>{ baseDomain( url ) }</span>
			</div>
		</div>
	);
};

export default BlueskyPostCard;
