import clsx from 'clsx';
import { baseDomain, firstValid, hardTruncation, shortEnough, stripHtmlTags } from '../helpers';
import { MediaImage } from '../shared/media-image';
import { TwitterCardProps } from './types';

const DESCRIPTION_LENGTH = 280;

const twitterDescription = firstValid(
	shortEnough( DESCRIPTION_LENGTH ),
	hardTruncation( DESCRIPTION_LENGTH )
);

export const Card: React.FC< TwitterCardProps > = ( {
	description,
	image,
	imageFocalPoint,
	title,
	cardType,
	url,
} ) => {
	const cardClassNames = clsx( `twitter-preview__card-${ cardType }`, {
		'twitter-preview__card-has-image': !! image,
	} );

	return (
		<div className="twitter-preview__card">
			<div className={ cardClassNames }>
				{ image && (
					<MediaImage
						className="twitter-preview__card-image"
						src={ image }
						alt=""
						focalPoint={ imageFocalPoint }
					/>
				) }
				<div className="twitter-preview__card-body">
					<div className="twitter-preview__card-url">{ baseDomain( url || '' ) }</div>
					<div className="twitter-preview__card-title">{ title }</div>
					<div className="twitter-preview__card-description">
						{ twitterDescription( stripHtmlTags( description ) ) }
					</div>
				</div>
			</div>
		</div>
	);
};
