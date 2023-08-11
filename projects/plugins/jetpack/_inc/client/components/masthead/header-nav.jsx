import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import ButtonGroup from 'components/button-group';
import analytics from 'lib/analytics';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';
import {
	getSiteConnectionStatus,
	hasConnectedOwner as hasConnectedOwnerSelector,
	isCurrentUserLinked as isCurrentUserLinkedSelector,
	isSiteRegistered,
} from 'state/connection';
import { userCanEditPosts, userCanManageOptions } from 'state/initial-state';
import { getActiveModules } from 'state/modules';

const HeaderNavComponent = props => {
	const {
		activeModules,
		canEditPosts,
		canManageOptions,
		hasConnectedOwner,
		isCurrentUserLinked,
		isSiteConnected,
		location = { pathname: '' },
		siteConnectionStatus,
	} = props;

	const { pathname } = location;

	const isDashboardView =
		[ '/', '/dashboard', '/my-plan', '/plans' ].includes( pathname ) ||
		pathname.includes( '/recommendations' );
	const isStatic = '' === pathname;

	const onTrackDashClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'masthead',
			path: 'nav_dashboard',
		} );
	}, [] );

	const onTrackSettingsClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: 'masthead',
			path: 'nav_settings',
		} );
	}, [] );

	if ( isStatic ) {
		return null;
	}

	if ( ! siteConnectionStatus ) {
		return null;
	}

	/**
	 * Determine whether a user can access the Jetpack Settings page.
	 *
	 * Rules are:
	 * - We're not on the /setup page route
	 * - user is allowed to see the Jetpack Admin
	 * - site is connected or in offline mode
	 * - non-admins only need access to the settings when there are modules they can manage.
	 */
	if ( pathname.startsWith( '/setup' ) ) {
		return null;
	}

	if ( ! canEditPosts ) {
		return null;
	}

	if ( siteConnectionStatus !== 'offline' && ! isSiteConnected ) {
		return null;
	}

	if ( siteConnectionStatus !== 'offline' && ! canManageOptions ) {
		if ( ! hasConnectedOwner ) {
			return null;
		}

		if ( ! isCurrentUserLinked ) {
			return null;
		}

		// Are there any modules accessible by non-admins active?
		const activeNonAdminModules = activeModules.some( module =>
			[ 'post-by-email', 'publicize' ].includes( module )
		);

		if ( ! activeNonAdminModules ) {
			return null;
		}
	}

	return (
		<div className="jp-masthead__nav">
			<ButtonGroup>
				<Button
					compact={ true }
					href="#/dashboard"
					primary={ isDashboardView && ! isStatic }
					onClick={ onTrackDashClick }
				>
					{ __( 'Dashboard', 'jetpack' ) }
				</Button>
				<Button
					compact={ true }
					href="#/settings"
					primary={ ! isDashboardView && ! isStatic }
					onClick={ onTrackSettingsClick }
				>
					{ __( 'Settings', 'jetpack' ) }
				</Button>
			</ButtonGroup>
		</div>
	);
};

const HeaderNav = connect( state => {
	return {
		canEditPosts: userCanEditPosts( state ),
		canManageOptions: userCanManageOptions( state ),
		hasConnectedOwner: hasConnectedOwnerSelector( state ),
		isCurrentUserLinked: isCurrentUserLinkedSelector( state ),
		isSiteConnected: isSiteRegistered( state ),
		activeModules: getActiveModules( state ),
		siteConnectionStatus: getSiteConnectionStatus( state ),
	};
} )( HeaderNavComponent );

export { HeaderNav };
