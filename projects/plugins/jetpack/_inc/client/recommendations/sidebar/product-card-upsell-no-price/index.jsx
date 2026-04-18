import { getRedirectUrl } from '@automattic/jetpack-components';
import { Icon, external } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import { useCallback, useEffect } from 'react';
import analytics from 'lib/analytics';
import RecommendedHeader from '../recommended-header';
import { SidebarCard } from '../sidebar-card';

const ProductCardUpsellNoPrice = () => {
	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_display', {
			type: 'upsell_no_price',
		} );
	}, [] );

	const onLearnMoreClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_click', {
			type: 'upsell_no_price',
		} );
	}, [] );

	const features = [
		__( 'Robust security to keep your site safe', 'jetpack' ),
		__( 'Speed-enhancing performance tools', 'jetpack' ),
		__( 'Increase site growth with marketing', 'jetpack' ),
	];

	return (
		<SidebarCard header={ <RecommendedHeader /> }>
			<div>
				<h2>{ __( 'Powerful security, performance, and marketing', 'jetpack' ) }</h2>
				<ul className="jp-recommendations-sidebar-card__features">
					{ features.map( feature => (
						<li key={ feature }>{ feature }</li>
					) ) }
				</ul>
				<p>
					{ __(
						'Explore premium Jetpack product bundles or pick and choose exactly what you need.',
						'jetpack'
					) }
				</p>
				<Button
					href={ getRedirectUrl( 'jetpack-plans' ) }
					onClick={ onLearnMoreClick }
					target="blank"
					rel="noopener noreferrer"
				>
					{ __( 'Learn more', 'jetpack' ) }
					<Icon icon={ external } />
				</Button>
			</div>
		</SidebarCard>
	);
};

export { ProductCardUpsellNoPrice };
