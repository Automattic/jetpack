/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import { isDevMode, isUnavailableInDevMode } from 'state/connection';
import { userCanManageModules, isSitePublic } from 'state/initial-state';
import { getSitePlan } from 'state/site';

export const SettingsGroup = props => {
	let module = props.module,
		support = props.support
			? props.support
			: module && '' !== module.learn_more_button
				? module.learn_more_button
				: false,
		// Disable in Dev Mode
		disableInDevMode = props.disableInDevMode && props.isUnavailableInDevMode( module.module );

	return (
		<Card className={ classNames( 'jp-form-settings-group', { 'jp-form-has-child': props.hasChild, 'jp-form-settings-disable': disableInDevMode } ) }>
			{
				disableInDevMode
					? <div className="jp-form-block-click">
						<div className="jp-form-setting-explanation jp-devmode-message">{ __( 'Feature unavailable in Dev Mode.' ) }</div>
					  </div>
					: ''
			}
			{
				support
					? <div className="jp-module-settings__learn-more">
						<Button borderless compact href={ support }>
							<Gridicon icon="help-outline" />
							<span className="screen-reader-text">{ __( 'Learn More' ) }</span>
						</Button>
					  </div>
					: ''
			}
			{
				props.children
			}
		</Card>
	);
};

export default connect(
	( state ) => {
		return {
			isDevMode: isDevMode( state ),
			sitePlan: getSitePlan( state ),
			isSitePublic: isSitePublic( state ),
			userCanManageModules: userCanManageModules( state ),
			isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name )
		};
	}
)(SettingsGroup);