/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import classNames from 'classnames';
import InfoPopover from 'components/info-popover';
import ExternalLink from 'components/external-link';
import includes from 'lodash/includes';
import noop from 'lodash/noop';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
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
	const support = props.support.link ? props.support : false;
	let displayFadeBlock = disableInDevMode;

	if ( ( 'post-by-email' === module.module && ! props.isLinked ) ||
		( 'after-the-deadline' === module.module && ( ! props.userCanManageModules && props.userCanEditPosts && ! props.isModuleActivated( 'after-the-deadline' ) ) ) ) {
		displayFadeBlock = true;
	}

	const trackInfoClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'info-icon',
			feature: module.module
		} );
	};

	const trackLearnMoreClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'learn-more',
			feature: module.module
		} );
	};

	return (
		<div className="jp-form-settings-group">
			<Card className={ classNames( {
				'jp-form-has-child': props.hasChild,
				'jp-form-settings-disable': disableInDevMode
			} ) }>
				{
					displayFadeBlock && <div className="jp-form-block-fade" />
				}
				{
					support && (
						<div className="jp-module-settings__learn-more">
							<InfoPopover
								position="left"
								onClick={ trackInfoClick }
								screenReaderText={ __( 'Learn more' ) }
								>
								{ props.support.text && ( props.support.text + ' ' ) }
								<ExternalLink
									onClick={ trackLearnMoreClick }
									icon={ false }
									href={ props.support.link }
									target="_blank" rel="noopener noreferrer"
									>
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
