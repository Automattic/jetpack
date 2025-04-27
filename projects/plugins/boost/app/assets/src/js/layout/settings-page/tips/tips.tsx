import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import styles from './tips.module.scss';
import { recordBoostEvent } from '$lib/utils/analytics';
import { ExternalLink } from '@wordpress/components';

const Tips = () => {
	const pingdomLink = getRedirectUrl( 'jetpack-boost-pingdom' );
	const whySpeedLink = getRedirectUrl( 'jetpack-boost-why-speed' );

	return (
		<div className="jb-section jb-section--alt">
			<div className="jb-container--narrow">
				<div className={ styles.tips }>
					<h3 className={ styles[ 'tips-title' ] }>{ __( 'Did you know?', 'jetpack-boost' ) }</h3>
					<div className={ styles[ 'tips-items' ] }>
						<div className={ styles.item }>
							<div className={ styles[ 'item-rate' ] }>4x</div>
							<div className={ styles[ 'item-description' ] }>
								{ createInterpolateElement(
									__(
										`Pages that take over 3 seconds to load have 4x the bounce rate of pages that load in 2 seconds or less. (source: <link>Pingdom</link>).`,
										'jetpack-boost'
									),
									{
										link: (
											<ExternalLink
												onClick={ () => recordBoostEvent( 'pingdom_link_clicked', {} ) }
												href={ pingdomLink }
											/>
										),
									}
								) }
							</div>
						</div>
						<div className={ styles.item }>
							<div className={ styles[ 'item-rate' ] }>20%</div>
							<div className={ styles[ 'item-description' ] }>
								{ createInterpolateElement(
									__(
										`A one-second delay in loading times can reduce conversion rates by 20%. (source: <link>Google</link>).`,
										'jetpack-boost'
									),
									{
										link: (
											<ExternalLink
												onClick={ () => recordBoostEvent( 'why_speed_link_clicked', {} ) }
												href={ whySpeedLink }
											/>
										),
									}
								) }
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Tips;
