import { imagePath } from 'constants/urls';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import AppsBadge from 'components/apps-badge';
import analytics from 'lib/analytics';
import detectMobileDevice from 'lib/device-detector';
import { useCallback, useEffect } from 'react';
import { SidebarCard } from '../sidebar-card';
import type { FC } from 'react';

import './style.scss';

type Props = {
	slug: string;
	underside?: boolean;
};

const MobileApp: FC< Props > = ( { slug, underside = false } ) => {
	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_display', {
			type: 'mobile_app',
			slug: slug,
		} );
	}, [ slug ] );

	const onJpcomAppClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_click', {
			type: 'mobile_app_jpcom',
			slug: slug,
		} );
	}, [ slug ] );

	const onAppBadgeClick = useCallback(
		storeName => {
			analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_click', {
				type: 'mobile_app_badge',
				store: storeName,
				slug: slug,
			} );
		},
		[ slug ]
	);

	const AppStoreBadge = () => (
		<div className="jp-recommendations-sidebar-mobile__apps-badge">
			<AppsBadge
				onBadgeClick={ onAppBadgeClick }
				storeName={ 'ios' }
				utm_source={ 'jetpack-plugin-recommendations' }
			/>
		</div>
	);

	const GooglePlayBadge = () => (
		<div className="jp-recommendations-sidebar-mobile__apps-badge">
			<AppsBadge
				onBadgeClick={ onAppBadgeClick }
				storeName={ 'android' }
				utm_source={ 'jetpack-plugin-recommendations' }
			/>
		</div>
	);

	const QRCode = () => (
		<div className="jp-recommendations-sidebar-mobile__qr-code-section">
			<img
				className="jp-recommendations-sidebar-mobile__qr-code-image"
				// Get the QR code with the correct utm_source to track individual interaction. Each QR code is named the same with the slug appended to the end.
				src={ imagePath + `/recommendations/mobile-app-qr-code-${ slug }.png` }
				width={ 80 }
				height={ 80 }
				alt="qr code to jetpack.com/app/ web page"
			/>
			<p className="jp-recommendations-sidebar-mobile__qr-code-body">
				{ createInterpolateElement(
					__(
						'Visit <ExternalLink>jetpack.com/app</ExternalLink> or scan this code to download the Jetpack mobile app.',
						'jetpack'
					),
					{
						ExternalLink: (
							<ExternalLink
								href={ getRedirectUrl( 'jetpack-plugin-recommendations-mobile-app-component' ) }
								rel="noopener noreferrer"
								target="_blank"
								onClick={ onJpcomAppClick }
							></ExternalLink>
						),
					}
				) }
			</p>
		</div>
	);

	const getHeading = () => {
		switch ( slug ) {
			case 'download-app':
				return __( 'Check your site activity anywhere, any time.', 'jetpack' );
			case 'one-click-restores':
				return __( 'Restore a backup anytime with the Jetpack mobile app.', 'jetpack' );
			case 'manage-security':
				return __( 'Realtime security notifications anywhere, any time.', 'jetpack' );
			case 'upsell':
				return __( 'Jetpack puts WordPress in your pocket.', 'jetpack' );
			default:
				return __( 'Jetpack puts WordPress in your pocket.', 'jetpack' );
		}
	};

	const getBody = () => {
		switch ( slug ) {
			case 'download-app':
				return __(
					'Never miss an important event with realtime notifications and your activity log just a tap away.',
					'jetpack'
				);
			case 'one-click-restores':
				return __(
					'Keep track of your site’s activity and restore your site anywhere, any time.',
					'jetpack'
				);
			case 'manage-security':
				return __(
					'Get instant alerts for serious issues and fix them with a simple tap.',
					'jetpack'
				);
			case 'upsell':
				return __(
					'The Jetpack mobile app gives you everything you need to grow and manage your WordPress site anywhere, anytime.',
					'jetpack'
				);
			default:
				return __(
					'The Jetpack mobile app gives you everything you need to grow and manage your WordPress site anywhere, anytime.',
					'jetpack'
				);
		}
	};

	// Get device type and display relevant link
	// Google play store link for android, App Store link for ios, and QR code otherwise
	const getAppLinkSection = () => {
		const device = detectMobileDevice();

		switch ( device ) {
			case 'ios':
				return <AppStoreBadge />;
			case 'android':
				return <GooglePlayBadge />;
			case 'windows':
			case 'unknown':
				return <QRCode />;
			default:
				return <QRCode />;
		}
	};

	const headerImgSize = underside ? 35 : 25;
	const header = (
		<div className="jp-recommendations-sidebar-mobile__header-container">
			<img
				src={ imagePath + '/recommendations/wordpress-icon.svg' }
				width={ headerImgSize }
				height={ headerImgSize }
				alt=""
			/>
			<img
				className={ clsx( 'jp-recommendation-sidebar-mobile__jetpack-icon', {
					underside: underside,
				} ) }
				src={ imagePath + '/recommendations/jetpack-icon.svg' }
				width={ headerImgSize }
				height={ headerImgSize }
				alt=""
			/>
		</div>
	);

	return (
		<SidebarCard className={ underside ? 'underside' : '' } header={ header }>
			<h2 className="jp-recommendation-sidebar-mobile__heading">{ getHeading() }</h2>

			<p>{ getBody() }</p>

			{ getAppLinkSection() }
		</SidebarCard>
	);
};

export { MobileApp };
