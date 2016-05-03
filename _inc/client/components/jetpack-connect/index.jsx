/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import Button from 'components/button';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import { getConnectUrl } from 'state/initial-state';

const JetpackConnect = React.createClass( {
	render: function() {
		return (
			<div className="jp-connection__container">

				<h2 className="jp-connection__container-title">Please Connect Jetpack</h2>

				<Card className="jp-connection__cta">
					<p className="jp-connection__description">Please connect to or create a WordPress.com account to enable Jetpack, including powerful security, traffic, and customization services.</p>
					<Button className="is-primary jp-connection__button" onClick={ getConnectUrl( this.props ) } >Connect Jetpack</Button>
					<p><a href="#" className="jp-connection__link">No WordPress.com account? Create one for free.</a></p>
				</Card>

			</div>
		);
	}
} );

export default connect( ( state ) => {
	return state;
} )( JetpackConnect );
