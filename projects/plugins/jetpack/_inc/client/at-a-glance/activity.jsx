import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import Card from 'components/card';
import DashItem from 'components/dash-item';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { isOfflineMode } from 'state/connection';

class DashActivity extends Component {
	static propTypes = {
		inOfflineMode: PropTypes.bool.isRequired,
		siteRawUrl: PropTypes.string.isRequired,
	};

	static defaultProps = {
		inOfflineMode: false,
		siteRawUrl: '',
	};

	trackActivityClick = () => {
		analytics.tracks.recordJetpackClick( {
			type: 'activity-link',
			target: 'at-a-glance',
			feature: 'activity-log',
		} );
	};

	render() {
		const { inOfflineMode } = this.props;
		const activityLogOnlyText = __(
			'Jetpack keeps a complete record of everything that happens on your site, taking the guesswork out of site management, debugging, and repair.',
			'jetpack'
		);

		return (
			<div className="jp-dash-item__interior">
				<DashItem
					label={ __( 'Activity', 'jetpack' ) }
					isModule={ false }
					className={ clsx( {
						'jp-dash-item__is-inactive': inOfflineMode,
					} ) }
					pro={ false }
				>
					<p className="jp-dash-item__description">
						{ inOfflineMode
							? __( 'Unavailable in Offline Mode.', 'jetpack' )
							: activityLogOnlyText }
					</p>
				</DashItem>
				<Card
					key="view-activity"
					className="jp-dash-item__manage-in-wpcom"
					compact
					href={ getRedirectUrl( 'calypso-activity-log', { site: this.props.siteRawUrl } ) }
					target="_blank"
					rel="noopener noreferrer"
					onClick={ this.trackActivityClick }
				>
					{ __( 'View site activity', 'jetpack' ) }
				</Card>
			</div>
		);
	}
}

export default connect( state => ( {
	inOfflineMode: isOfflineMode( state ),
} ) )( DashActivity );
