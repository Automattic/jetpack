import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import analytics from 'lib/analytics';
import React, { useCallback, useEffect } from 'react';
import withUpgradeUrl from '../../hoc/with-upgrade-url';
import RecommendedHeader from '../recommended-header';
import { SidebarCard } from '../sidebar-card';

const ProductCardUpsellNoPriceComponent = props => {
	const { upgradeUrl } = props;

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
					rna
					href={ upgradeUrl }
					onClick={ onLearnMoreClick }
					target="blank"
					rel="noopener noreferrer"
				>
					{ __( 'Learn more', 'jetpack' ) }
					<Gridicon icon="external" />
				</Button>
			</div>
		</SidebarCard>
	);
};

const ProductCardUpsellNoPrice = withUpgradeUrl( ProductCardUpsellNoPriceComponent );

export { ProductCardUpsellNoPrice };
