import classNames from 'classnames';
import Card from 'components/card';
import SupportInfo from 'components/support-info';
import { includes, noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import {
	isOfflineMode,
	isUnavailableInOfflineMode,
	isUnavailableInSiteConnectionMode,
	isCurrentUserLinked,
} from 'state/connection';
import { userCanManageModules, isSitePublic, userCanEditPosts } from 'state/initial-state';
import { isModuleActivated } from 'state/modules';

export const SettingsGroup = props => {
	const module = props.module;

	// Non admin users only get Publicize, After the Deadline, and Post by Email settings.
	// composing is not a module slug but it's used so the Composing card is rendered to show AtD.
	if (
		module.module &&
		! props.userCanManageModules &&
		! includes( [ 'post-by-email', 'publicize' ], module.module )
	) {
		return <span />;
	}

	const disableInOfflineMode =
		props.disableInOfflineMode && props.isUnavailableInOfflineMode( module.module );

	const disableInSiteConnectionMode =
		props.disableInSiteConnectionMode && props.isUnavailableInSiteConnectionMode( module.module );

	let displayFadeBlock = disableInOfflineMode || disableInSiteConnectionMode;

	if ( 'post-by-email' === module.module && ! props.isLinked ) {
		displayFadeBlock = true;
	}

	return (
		<div className={ classNames( 'jp-form-settings-group', props.className ) }>
			<Card
				className={ classNames( {
					'jp-form-has-child': props.hasChild,
					'jp-form-settings-disable': disableInOfflineMode || disableInSiteConnectionMode,
				} ) }
			>
				{ displayFadeBlock && <div className="jp-form-block-fade" /> }
				{ props.support.link && <SupportInfo module={ module } { ...props.support } /> }
				{ props.children }
			</Card>
		</div>
	);
};

SettingsGroup.propTypes = {
	support: PropTypes.object,
	module: PropTypes.object,
	disableInOfflineMode: PropTypes.bool.isRequired,
	disableInSiteConnectionMode: PropTypes.bool,
	isOfflineMode: PropTypes.bool.isRequired,
	isSitePublic: PropTypes.bool.isRequired,
	userCanManageModules: PropTypes.bool.isRequired,
	isLinked: PropTypes.bool.isRequired,
	isUnavailableInOfflineMode: PropTypes.func.isRequired,
	className: PropTypes.string,
};

SettingsGroup.defaultProps = {
	support: { text: '', link: '' },
	module: {},
	disableInOfflineMode: false,
	disableInSiteConnectionMode: false,
	isOfflineMode: false,
	isSitePublic: true,
	userCanManageModules: false,
	isLinked: false,
	isUnavailableInOfflineMode: noop,
	className: '',
};

export default connect( state => {
	return {
		isOfflineMode: isOfflineMode( state ),
		isSitePublic: isSitePublic( state ),
		userCanManageModules: userCanManageModules( state ),
		userCanEditPosts: userCanEditPosts( state ),
		isLinked: isCurrentUserLinked( state ),
		isModuleActivated: module => isModuleActivated( state, module ),
		isUnavailableInOfflineMode: module_name => isUnavailableInOfflineMode( state, module_name ),
		isUnavailableInSiteConnectionMode: module_name =>
			isUnavailableInSiteConnectionMode( state, module_name ),
	};
} )( SettingsGroup );
