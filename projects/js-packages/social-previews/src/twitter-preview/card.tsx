import { sprintf, __ } from '@wordpress/i18n';
import { baseDomain } from '../helpers';
import { TwitterCardProps } from './types';

export const Card: React.FC< TwitterCardProps > = ( { image, title, url } ) => {
	return (
		<div className="twitter-preview__card">
			<div className="twitter-preview__card-large">
				{ image && (
					<div className="twitter-preview__card-image-wrapper">
						<img className="twitter-preview__card-image" src={ image } alt="" />
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
