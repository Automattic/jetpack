/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Card from 'components/card';
import classNames from 'classnames';
import includes from 'lodash/includes';
import noop from 'lodash/noop';

/**
 * Internal dependencies
 */
import SupportInfo from 'components/support-info';
import { isDevMode, isUnavailableInDevMode, isCurrentUserLinked } from 'state/connection';
import { userCanManageModules, isSitePublic, userCanEditPosts } from 'state/initial-state';
import { isModuleActivated } from 'state/modules';

export const SettingsGroup = props => {
	const module = props.module;

	// Non admin users only get Publicize, After the Deadline, and Post by Email settings.
	// composing is not a module slug but it's used so the Composing card is rendered to show AtD.
	if ( module.module && ! props.userCanManageModules && ! includes( [ 'after-the-deadline', 'post-by-email', 'publicize' ], module.module ) ) {
		return <span />;
	}

	const disableInDevMode = props.disableInDevMode && props.isUnavailableInDevMode( module.module );
	let displayFadeBlock = disableInDevMode;

	if ( ( 'post-by-email' === module.module && ! props.isLinked ) ||
		( 'after-the-deadline' === module.module && ( ! props.userCanManageModules && props.userCanEditPosts && ! props.isModuleActivated( 'after-the-deadline' ) ) ) ) {
		displayFadeBlock = true;
	}

	return (
		<div className="jp-form-settings-group">
			<Card className={ classNames( {
				'jp-form-has-child': props.hasChild,
				'jp-form-settings-disable': disableInDevMode
			} ) }>
				{ displayFadeBlock && <div className="jp-form-block-fade" /> }
				{
					props.support.link &&
						<SupportInfo
							module={ module }
							{ ...props.support }
						/>
				}
				{ props.children }
			</Card>
		</div>
	);
};

SettingsGroup.propTypes = {
	support: PropTypes.object,
	module: PropTypes.object,
	disableInDevMode: PropTypes.bool.isRequired,
	isDevMode: PropTypes.bool.isRequired,
	isSitePublic: PropTypes.bool.isRequired,
	userCanManageModules: PropTypes.bool.isRequired,
	isLinked: PropTypes.bool.isRequired,
	isUnavailableInDevMode: PropTypes.func.isRequired
};

SettingsGroup.defaultProps = {
	support: { text: '', link: '' },
	module: {},
	disableInDevMode: false,
	isDevMode: false,
	isSitePublic: true,
	userCanManageModules: false,
	isLinked: false,
	isUnavailableInDevMode: noop
};

export default connect(
	state => {
		return {
			isDevMode: isDevMode( state ),
			isSitePublic: isSitePublic( state ),
			userCanManageModules: userCanManageModules( state ),
			userCanEditPosts: userCanEditPosts( state ),
			isLinked: isCurrentUserLinked( state ),
			isModuleActivated: module => isModuleActivated( state, module ),
			isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name )
		};
	}
)( SettingsGroup );
