import { __ } from '@wordpress/i18n';
import QuerySite from 'components/data/query-site';
import React from 'react';
import { connect } from 'react-redux';
import {
	hasConnectedOwner as hasConnectedOwnerSelector,
	isOfflineMode,
	isUnavailableInOfflineMode as isUnavailableInOfflineModeSelector,
} from 'state/connection';
import { isAtomicSite as isAtomicSiteSelector } from 'state/initial-state';
import { getModule } from 'state/modules';
import { isModuleFound as isModuleFoundSelector } from 'state/search';
import { SubscriptionsSettings } from './subscriptions-settings';

/**
 * Newsletter Section.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Newsletter settings component.
 */
function Subscriptions( props ) {
	const { active, isModuleFound, searchTerm } = props;

	const foundSubscriptions = isModuleFound( 'subscriptions' );

	if ( ! searchTerm && ! active ) {
		return null;
	}

	if ( ! foundSubscriptions ) {
		return null;
	}

	return (
		<div>
			<QuerySite />
			<h1 className="screen-reader-text">{ __( 'Jetpack Newsletter Settings', 'jetpack' ) }</h1>
			<h2 className="jp-settings__section-title">
				{ searchTerm
					? __( 'Newsletter', 'jetpack' )
					: __(
							'Transform your blog posts into newsletters to easily reach your subscribers.',
							'jetpack',
							/* dummy arg to avoid bad minification */ 0
					  ) }
			</h2>
			{ foundSubscriptions && (
				<SubscriptionsSettings
					isLinked={ this.props.isLinked }
					connectUrl={ this.props.connectUrl }
					siteRawUrl={ this.props.siteRawUrl }
				/>
			) }
		</div>
	);
}

export default connect( state => {
	return {
		hasConnectedOwner: hasConnectedOwnerSelector( state ),
		module: module_name => getModule( state, module_name ),
		isOffline: isOfflineMode( state ),
		isModuleFound: module_name => isModuleFoundSelector( state, module_name ),
		isUnavailableInOfflineMode: module_name =>
			isUnavailableInOfflineModeSelector( state, module_name ),
		isAtomicSite: isAtomicSiteSelector( state ),
	};
} )( Subscriptions );
