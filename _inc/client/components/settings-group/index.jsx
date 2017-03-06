/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import classNames from 'classnames';
import InfoPopover from 'components/info-popover';
import ExternalLink from 'components/external-link';
import includes from 'lodash/includes';
import noop from 'lodash/noop';

/**
 * Internal dependencies
 */
import { isDevMode, isUnavailableInDevMode, isCurrentUserLinked } from 'state/connection';
import { userCanManageModules, isSitePublic } from 'state/initial-state';

export const SettingsGroup = props => {
	const module = props.module;

	// Non admin users only get Publicize, After the Deadline, and Post by Email settings. The UI doesn't have settings for Publicize.
	// composing is not a module slug but it's used so the Composing card is rendered to show AtD.
	if ( module.module && ! props.userCanManageModules && ! includes( [ 'after-the-deadline', 'post-by-email' ], module.module ) ) {
		return <span />;
	}

	const disableInDevMode = props.disableInDevMode && props.isUnavailableInDevMode( module.module ),
		support = ! props.support && module && '' !== module.learn_more_button
			? module.learn_more_button
			: props.support;
	let displayFadeBlock = disableInDevMode;

	if ( 'post-by-email' === module.module && ! props.isLinked ) {
		displayFadeBlock = true;
	}

	return (
		<div className="jp-form-settings-group">
			<Card className={ classNames( {
				'jp-form-has-child': props.hasChild,
				'jp-form-settings-disable': disableInDevMode
			} ) }>
				{
					displayFadeBlock && <div className="jp-form-block-fade"></div>
				}
				{
					support && (
						<div className="jp-module-settings__learn-more">
							<InfoPopover screenReaderText={ __( 'Learn more' ) }>
								<ExternalLink
									icon={ false }
									href={ support }
									target="_blank">
									{ __( 'Learn more' ) }
								</ExternalLink>
							</InfoPopover>
						</div>
					)
				}
				{
					props.children
				}
			</Card>
		</div>
	);
};

SettingsGroup.propTypes = {
	support: React.PropTypes.string,
	module: React.PropTypes.object,
	disableInDevMode: React.PropTypes.bool.isRequired,
	isDevMode: React.PropTypes.bool.isRequired,
	isSitePublic: React.PropTypes.bool.isRequired,
	userCanManageModules: React.PropTypes.bool.isRequired,
	isLinked: React.PropTypes.bool.isRequired,
	isUnavailableInDevMode: React.PropTypes.func.isRequired
};

SettingsGroup.defaultProps = {
	support: '',
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
			isLinked: isCurrentUserLinked( state ),
			isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name )
		};
	}
)( SettingsGroup );
