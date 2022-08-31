import { imagePath } from 'constants/urls';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import AppsBadge from 'components/apps-badge';
import analytics from 'lib/analytics';
import { useCallback, useEffect } from 'react';
// import DeviceDetector from '../../packages/device-detector-js';
import { SidebarCard } from '../sidebar-card';
import './style.scss';

const MobileApp = () => {
	{
		/* const deviceDetector = new DeviceDetector();
	const userAgent = window.navigator.userAgent;
	const device = deviceDetector.parse( userAgent ); */
	}

	const features = [
		__( 'Refined post and page editor', 'jetpack' ),
		__( 'Manage multiple sites from one dashboard', 'jetpack' ),
		__( 'Multi-site plugin management', 'jetpack' ),
		__( 'Free stock photo library', 'jetpack' ),
		__( 'Update your site from any device', 'jetpack' ),
	];

	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_display', {
			type: 'mobile_app',
		} );
	}, [] );

	const onWpcomClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_click', {
			type: 'mobile_app_wpcom',
		} );
	}, [] );

	const onAppBadgeClick = useCallback( storeName => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_click', {
			type: 'mobile_app_badge',
			store: storeName,
		} );
	}, [] );

	return (
		<SidebarCard illustrationPath={ imagePath + '/recommendations/mobile-app.svg' }>
			<div>
				<h2>{ __( 'Explore a better editing experience', 'jetpack' ) }</h2>
				<p>
					{ createInterpolateElement(
						__(
							'With Jetpack, you have <strong>free access</strong> to managing your site with <a>WordPress.com</a> and the Android and iOS WordPress apps.',
							'jetpack'
						),
						{
							strong: <strong />,
							a: (
								<a
									href="https://wordpress.com"
									target="_blank"
									rel="noreferrer"
									onClick={ onWpcomClick }
								/>
							),
						}
					) }
				</p>
				<ul className="jp-recommendations-sidebar-card__features">
					{ features.map( feature => (
						<li>{ feature }</li>
					) ) }
				</ul>
				<div className="jp-recommendations-sidebar-card__apps-badge">
					<AppsBadge
						onBadgeClick={ onAppBadgeClick }
						storeName={ 'ios' }
						utm_source={ 'jetpack-plugin-recommendations' }
					/>
					<AppsBadge
						onBadgeClick={ onAppBadgeClick }
						storeName={ 'android' }
						utm_source={ 'jetpack-plugin-recommendations' }
					/>
				</div>
			</div>
		</SidebarCard>
	);
};

export { MobileApp };
