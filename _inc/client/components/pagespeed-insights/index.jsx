/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
// import analytics from 'lib/analytics';
// import Card from 'components/card';
// import Button from 'components/button';

/**
 * Internal dependencies
 */
// import {
// 	getSiteConnectionStatus as _getSiteConnectionStatus,
// 	isCurrentUserLinked as _isCurrentUserLinked,
// } from 'state/connection';
// import Modal from 'components/modal';
import onKeyDownCallback from 'utils/onkeydown-callback';
import { getPagespeedInsights } from 'state/pagespeed/actions';
import { getPagespeedInsightsResults } from 'state/pagespeed';

export class PagespeedInsights extends React.Component {
	static displayName = 'PagespeedInsights';

	handleGetPagespeedInsights = e => {
		e.preventDefault();
		this.props.getPagespeedInsights( 'https://wordpress.com' );
	};

	render() {
		return (
			<div className="pagespeed-insights">
				<a
					role="button"
					tabIndex="0"
					className="pagespeed-insights__button"
					onClick={ this.handleGetPagespeedInsights }
					onKeyDown={ onKeyDownCallback( this.handleGetPagespeedInsights ) }
				>
					{ __( 'Click me for pagespeed results' ) }
				</a>
				<br />
				{ JSON.stringify( this.props.pagespeedResults ) }
			</div>
		);
	}
}

export default connect(
	state => {
		return {
			pagespeedResults: getPagespeedInsightsResults( state ),
		};
	},
	{
		getPagespeedInsights,
	}
)( PagespeedInsights );
