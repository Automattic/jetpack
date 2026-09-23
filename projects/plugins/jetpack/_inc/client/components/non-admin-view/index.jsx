import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import SearchableSettings from 'settings/index.jsx';
import { getSiteConnectionStatus } from 'state/connection';
import { userCanManageModules, userIsSubscriber as _userIsSubscriber } from 'state/initial-state';

class NonAdminView extends Component {
	shouldComponentUpdate( nextProps ) {
		return (
			nextProps.siteConnectionStatus !== this.props.siteConnectionStatus ||
			nextProps.location.pathname !== this.props.location.pathname
		);
	}

	renderMainContent = route => {
		let pageComponent;

		switch ( route ) {
			case '/settings':
			case '/writing':
			case '/sharing':
			case '/performance':
				if ( ! this.props.isSubscriber ) {
					pageComponent = (
						<SearchableSettings
							siteAdminUrl={ this.props.siteAdminUrl }
							siteRawUrl={ this.props.siteRawUrl }
							searchTerm={ this.props.searchTerm }
							userCanManageModules={ this.props.userCanManageModules }
						/>
					);
				}
				break;
			default:
				this.props.navigate( '/settings', { replace: true } );
				break;
		}

		window.wpNavMenuClassChange();

		return <div>{ pageComponent }</div>;
	};

	render() {
		return this.renderMainContent( this.props.location.pathname );
	}
}

NonAdminView.propTypes = {
	isSubscriber: PropTypes.bool.isRequired,
	siteConnectionStatus: PropTypes.any.isRequired,
};

export default connect( state => {
	return {
		siteConnectionStatus: getSiteConnectionStatus( state ),
		isSubscriber: _userIsSubscriber( state ),
		userCanManageModules: userCanManageModules( state ),
	};
} )( NonAdminView );
