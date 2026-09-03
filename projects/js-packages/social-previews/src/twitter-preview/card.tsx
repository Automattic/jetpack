import { sprintf, __ } from '@wordpress/i18n';
import { baseDomain } from '../helpers';
import { MediaImage } from '../shared/media-image';
import { TwitterCardProps } from './types';

// `description` and `cardType` are part of TwitterCardProps for backward
// compatibility with existing consumers, but are deliberately not rendered:
// X's current link card shows the title overlaid on the image and the source
// domain beneath it, with no description and no card-type variants.
export const Card: React.FC< TwitterCardProps > = ( { image, imageFocalPoint, title, url } ) => {
	return (
		<div className="twitter-preview__card">
			<div className="twitter-preview__card-large">
				{ image && (
					<div className="twitter-preview__card-image-wrapper">
						<MediaImage
							className="twitter-preview__card-image"
							src={ image }
							alt=""
							focalPoint={ imageFocalPoint }
						/>
						<div className="twitter-preview__card-title-overlay">
							<span>{ title }</span>
						</div>
					</div>
				) }
				<div className="twitter-preview__card-domain">
					{ sprintf(
						/* translators: %s is the domain name of the shared link */
						__( 'From %s', 'social-previews' ),
						baseDomain( url || '' )
					) }
				</div>
			</div>
		</div>
	);
};
