/**
 * External dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useEffect } from 'react';

/**
 * Internal dependencies
 */
import AppsBadge from './apps-badge';
import { Layout } from '../layout';
import Gridicon from 'components/gridicon';
import { imagePath } from 'constants/urls';
import analytics from 'lib/analytics';

/**
 * Style dependencies
 */
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

	return (
		<Layout
			illustrationPath={ imagePath + '/recommendations/mobile-app.svg' }
			content={
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
							<li>
								<Gridicon icon="checkmark-circle" />
								{ feature }
							</li>
						) ) }
					</ul>
					<div className="jp-recommendations-sidebar-card__apps-badge">
						<AppsBadge storeName={ 'ios' } utm_source={ 'jetpack-plugin-recommendations' } />
						<AppsBadge storeName={ 'android' } utm_source={ 'jetpack-plugin-recommendations' } />
					</div>
				</div>
			}
		/>
	);
};

export { MobileApp };
