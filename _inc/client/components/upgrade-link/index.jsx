/**
 * External dependencies
 */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getUpgradeUrl } from 'state/initial-state';

/**
 * Component to render a link.
 */
class UpgradeLink extends PureComponent {

	static propTypes = {
		source: PropTypes.string.isRequired,

		// Connected
		siteRawUrl: PropTypes.string.isRequired,
		affiliateCode: PropTypes.string.isRequired,
	};

	render() {
		return (
			<a
				href={ this.props.upgradeUrl }
				target="_blank"
				rel="noopener noreferrer"
				>
					{ this.props.children }
			</a>
		);
	}
}

export default connect(
	( state, ownProps ) => ( {
		upgradeUrl: getUpgradeUrl( state, ownProps.source ),
	} )
)( UpgradeLink );
