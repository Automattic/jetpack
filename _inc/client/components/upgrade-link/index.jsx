/**
 * External dependencies
 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import { getUpgradeUrl } from 'state/initial-state';

/**
 * Component to render a link.
 */
class UpgradeLink extends PureComponent {
	static propTypes = {
		source: PropTypes.string.isRequired,
		target: PropTypes.string.isRequired,
		feature: PropTypes.string,

		// Connected
		upgradeUrl: PropTypes.string.isRequired,
	};

	trackClick = () => {
		const { target, feature } = this.props;

		if ( target ) {
			const featureProp = feature ? { feature } : {};

			analytics.tracks.recordJetpackClick( {
				type: 'upgrade-link',
				target,
				...featureProp,
			} );
		}
	};

	render() {
		return (
			<a
				href={ this.props.upgradeUrl }
				target="_blank"
				rel="noopener noreferrer"
				onClick={ this.trackClick }
			>
				{ this.props.children }
			</a>
		);
	}
}

export default connect( ( state, { source } ) => ( {
	upgradeUrl: getUpgradeUrl( state, source ),
} ) )( UpgradeLink );
