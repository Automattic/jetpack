import { __ } from '@wordpress/i18n';
import React from 'react';
import './style.scss';

const WpcomSiteManagementWidget = ( { siteName, siteDomain, siteIconUrl } ) => {
	const devToolItems = [
		{
			name: __( 'Deployments', 'jetpack-mu-wpcom' ),
			href: `/github-deployments/${ siteDomain }`,
		},
		{
			name: __( 'Monitoring', 'jetpack-mu-wpcom' ),
			href: `/site-monitoring/${ siteDomain }`,
		},
		{
			name: __( 'Logs', 'jetpack-mu-wpcom' ),
			href: `/site-logs/${ siteDomain }/php`,
		},
		{
			name: __( 'Staging Site', 'jetpack-mu-wpcom' ),
			href: `/staging-site/${ siteDomain }`,
		},
		{
			name: __( 'Server Settings', 'jetpack-mu-wpcom' ),
			href: `/hosting-config/${ siteDomain }`,
		},
	];

	return (
		<>
			<div className="wpcom_site_management_widget__header">
				<div className="wpcom_site_management_widget__site-favicon">
					{
						/* webclip.png is the default on WoA sites. Anything other than that means we have a custom site icon. */
						siteIconUrl && siteIconUrl !== 'https://s0.wp.com/i/webclip.png' ? (
							<img src={ siteIconUrl } alt="favicon" />
						) : (
							<span>{ siteName[ 0 ] }</span>
						)
					}
				</div>
				<div className="wpcom_site_management_widget__site-info">
					<div className="wpcom_site_management_widget__site-name">{ siteName }</div>
					<div className="wpcom_site_management_widget__site-url">{ siteDomain }</div>
				</div>
				<div className="wpcom_site_management_widget__site-actions">
					<a className="button-primary" href={ `https://wordpress.com/overview/${ siteDomain }` }>
						{ __( 'Overview', 'jetpack-mu-wpcom' ) }
					</a>
				</div>
			</div>
			<div className="wpcom_site_management_widget__content">
				<p>
					{ __(
						'Get a quick overview of your plans, storage, and domains, or easily access your development tools using the links provided below:',
						'jetpack-mu-wpcom'
					) }
				</p>
				<div className="wpcom_site_management_widget__dev-tools">
					<div className="wpcom_site_management_widget__dev-tools-title">
						{ __( 'DEV TOOLS:', 'jetpack-mu-wpcom' ) }
					</div>
					<div className="wpcom_site_management_widget__dev-tools-content">
						<ul>
							{ devToolItems.map( item => (
								<li key={ item.name }>
									<a href={ `https://wordpress.com${ item.href }` }>{ item.name }</a>
								</li>
							) ) }
						</ul>
					</div>
				</div>
			</div>
		</>
	);
};

export default WpcomSiteManagementWidget;
