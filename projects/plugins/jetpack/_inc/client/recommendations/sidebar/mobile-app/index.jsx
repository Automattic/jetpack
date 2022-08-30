import { imagePath } from 'constants/urls';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import AppsBadge from 'components/apps-badge';
import analytics from 'lib/analytics';
import { useCallback, useEffect } from 'react';
import { SidebarCard } from '../sidebar-card';

import './style.scss';

const MobileApp = () => {
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

	const header = (
		<div className="jp-recommendations-sidebar-mobile__header-container">
			<img
				src={ imagePath + '/recommendations/wordpress-icon.svg' }
				width={ 25 }
				height={ 25 }
				alt="wordpress icon"
			/>
			<img
				className="jp-recommendation-sidebar-mobile__jetpack-icon"
				src={ imagePath + '/recommendations/jetpack-icon.svg' }
				width={ 27 }
				height={ 27 }
				alt="jetpack icon"
			/>
		</div>
	);

	return (
		<SidebarCard header={ header }>
			<div>
				<h2 className="jp-recommendation-sidebar-mobile__heading">
					{ __( 'Explore a better editing experience', 'jetpack' ) }
				</h2>
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
					{ features.map( ( feature, index ) => (
						<li key={ index }>{ feature }</li>
					) ) }
				</ul>
				<div className="jp-recommendations-sidebar-mobile__apps-badge">
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
