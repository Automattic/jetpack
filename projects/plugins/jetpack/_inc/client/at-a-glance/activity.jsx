import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
// NOTE: DashItem is preserved — compound Jetpack-specific widget that bundles
// ModuleToggle, ProStatus, SectionHeader, SupportInfo, and Redux plumbing.
// Re-implementing inline is out of scope for this UI-primitive refactor.
import DashItem from 'components/dash-item';
import analytics from 'lib/analytics';
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
				<Card.Root
					key="view-activity"
					className="jp-dash-item__manage-in-wpcom is-compact is-card-link"
				>
					<Card.Content>
						<a
							href={ getRedirectUrl( 'calypso-activity-log', { site: this.props.siteRawUrl } ) }
							target="_blank"
							rel="noopener noreferrer"
							onClick={ this.trackActivityClick }
						>
							{ __( 'View site activity', 'jetpack' ) }
						</a>
					</Card.Content>
				</Card.Root>
			</div>
		);
	}
}

export default connect( state => ( {
	inOfflineMode: isOfflineMode( state ),
} ) )( DashActivity );
