import { __ } from '@wordpress/i18n';
import React from 'react';
import './style.scss';

const WpcomSiteManagementWidget = ( { siteName, siteUrl, siteIconUrl, isBlockTheme } ) => {
	const siteDomain = new URL( siteUrl ).hostname;
	return (
		<>
			<div className="wpcom_site_preview_wrapper">
				<div className="wpcom_site_preview">
					<iframe
						loading="lazy"
						title="Site Preview"
						src={ `${ siteUrl }/?hide_banners=true&preview_overlay=true&preview=true` }
						inert="true"
					></iframe>
				</div>
			</div>
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
					<div className="wpcom_site_management_widget__site-url">
						<a href={ siteUrl }>{ siteDomain }</a>
					</div>
				</div>
				<div className="wpcom_site_management_widget__site-actions">
					<a className="button-secondary" href={ `https://wordpress.com/overview/${ siteDomain }` }>
						{ __( 'Hosting Overview', 'jetpack-mu-wpcom' ) }
					</a>
					{ isBlockTheme ? (
						<a className="button-secondary" href={ `site-editor.php` }>
							{ __( 'Edit Site', 'jetpack-mu-wpcom' ) }
						</a>
					) : null }
				</div>
			</div>
		</>
	);
};

export default WpcomSiteManagementWidget;
