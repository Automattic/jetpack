/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AnAutomatticAirlineSVG from './an-automattic-airline-svg';
import getRedirectUrl from 'lib/jp-redirect';
import { getSiteAdminUrl } from 'state/initial-state';
import { getSiteConnectionStatus } from 'state/connection';
import './search-footer.scss';

/**
 * SearchFooter component definition.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} SearchFooter component.
 */
export function SearchFooter( props ) {
	const aboutPageUrl = props.siteConnectionStatus
		? props.siteAdminUrl + 'admin.php?page=jetpack_about'
		: getRedirectUrl( 'jetpack' );

	return (
		<div className="jp-search-dashboard-footer">
			<div className="jp-search-dashboard-footer__footer-left">
				<span className="jp-search-dashboard-footer__logo"></span>
				<span>{ __( 'Jetpack Search', 'jetpack' ) }</span>
			</div>
			<div className="jp-search-dashboard-footer__footer-right">
				<AnAutomatticAirlineSVG href={ aboutPageUrl } />
			</div>
		</div>
	);
}

export default connect( state => {
	return {
		siteAdminUrl: getSiteAdminUrl( state ),
		siteConnectionStatus: getSiteConnectionStatus( state ),
	};
} )( SearchFooter );
