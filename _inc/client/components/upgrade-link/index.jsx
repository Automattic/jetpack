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
		upgradeUrl: PropTypes.string.isRequired,
	};

	render() {
		return (
			<a href={ this.props.upgradeUrl } target="_blank" rel="noopener noreferrer">
				{ this.props.children }
			</a>
		);
	}
}

export default connect( ( state, { source } ) => ( {
	upgradeUrl: getUpgradeUrl( state, source ),
} ) )( UpgradeLink );
