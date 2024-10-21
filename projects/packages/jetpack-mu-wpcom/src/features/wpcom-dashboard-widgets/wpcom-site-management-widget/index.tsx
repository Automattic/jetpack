import { __ } from '@wordpress/i18n';
import React from 'react';
import './style.scss';
import type { Site } from '../types';

interface Props {
	site: Site;
}

const WpcomSiteManagementWidget = ( { site }: Props ) => {
	const { name, domain, iconUrl } = site;
	const devToolItems = [
		{
			name: __( 'Deployments', 'jetpack-mu-wpcom' ),
			href: `/github-deployments/${ domain }`,
		},
		{
			name: __( 'Monitoring', 'jetpack-mu-wpcom' ),
			href: `/site-monitoring/${ domain }`,
		},
		{
			name: __( 'Logs', 'jetpack-mu-wpcom' ),
			href: `/site-logs/${ domain }/php`,
		},
		{
			name: __( 'Staging Site', 'jetpack-mu-wpcom' ),
			href: `/staging-site/${ domain }`,
		},
		{
			name: __( 'Server Settings', 'jetpack-mu-wpcom' ),
			href: `/hosting-config/${ domain }`,
		},
	];

	return (
		<>
			<div className="wpcom-site-management-widget__header">
				<div className="wpcom-site-management-widget__site-favicon">
					{
						/* webclip.png is the default on WoA sites. Anything other than that means we have a custom site icon. */
						iconUrl && iconUrl !== 'https://s0.wp.com/i/webclip.png' ? (
							<img src={ iconUrl } alt="favicon" />
						) : (
							<span>{ name[ 0 ] }</span>
						)
					}
				</div>
				<div className="wpcom-site-management-widget__site-info">
					<div className="wpcom-site-management-widget__site-name">{ name }</div>
					<div className="wpcom-site-management-widget__site-url">{ domain }</div>
				</div>
				<div className="wpcom-site-management-widget__site-actions">
					<a className="button-primary" href={ `https://wordpress.com/overview/${ domain }` }>
						{ __( 'Overview', 'jetpack-mu-wpcom' ) }
					</a>
				</div>
			</div>
			<div className="wpcom-site-management-widget__content">
				<p>
					{ __(
						'Get a quick overview of your plans, storage, and domains, or easily access your development tools using the links provided below:',
						'jetpack-mu-wpcom'
					) }
				</p>
				<div className="wpcom-site-management-widget__dev-tools">
					<div className="wpcom-site-management-widget__dev-tools-title">
						{ __( 'DEV TOOLS:', 'jetpack-mu-wpcom' ) }
					</div>
					<div className="wpcom-site-management-widget__dev-tools-content">
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
