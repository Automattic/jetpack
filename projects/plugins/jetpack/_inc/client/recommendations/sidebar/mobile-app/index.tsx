import { imagePath } from 'constants/urls';
//import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import AppsBadge from 'components/apps-badge';
import analytics from 'lib/analytics';
import { useCallback, useEffect } from 'react';
import { SidebarCard } from '../sidebar-card';
import type { FC } from 'react';

import './style.scss';

type Props = {
	slug: string;
};

const MobileApp: FC< Props > = ( { slug } ) => {
	const getHeading = () => {
		switch ( slug ) {
			case 'download-app':
				return __( 'Check your site activity anywhere, any time.', 'jetpack' );
			default:
				return __( 'Check your site activity anywhere, any time.', 'jetpack' );
		}
	};

	const getBody = () => {
		switch ( slug ) {
			case 'download-app':
				return __(
					'Never miss an important event with realtime notifications and your activity log just a tap away.',
					'jetpack'
				);
			default:
				return __(
					'Never miss an important event with realtime notifications and your activity log just a tap away.',
					'jetpack'
				);
		}
	};

	//const QRCode = <div></div>;

	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_display', {
			type: 'mobile_app',
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
			{ /* Extra 2 pixels on width and height are to account for the white padding on this SVG, so the
			actual image will look the same size as the wordpress one */ }
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
			<h2 className="jp-recommendation-sidebar-mobile__heading">{ getHeading() }</h2>
			<p>{ getBody() }</p>
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
		</SidebarCard>
	);
};

export { MobileApp };
