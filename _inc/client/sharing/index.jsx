/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getModule } from 'state/modules';
import { getSettings } from 'state/settings';
import { isDevMode, isUnavailableInDevMode, isCurrentUserLinked, getConnectUrl } from 'state/connection';
import { isModuleFound as _isModuleFound } from 'state/search';
import { getSiteRawUrl, getSiteAdminUrl, userCanManageModules } from 'state/initial-state';
import QuerySite from 'components/data/query-site';
import { Publicize } from './publicize';
import { ShareButtons } from './share-buttons';
import { Likes } from './likes';

class Sharing extends Component {

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isDevMode: this.props.isDevMode,
			isUnavailableInDevMode: this.props.isUnavailableInDevMode,
			isLinked: this.props.isLinked,
			connectUrl: this.props.connectUrl,
			siteRawUrl: this.props.siteRawUrl,
			siteAdminUrl: this.props.siteAdminUrl,
			userCanManageModules: this.props.userCanManageModules,
		};

		const foundPublicize = this.props.isModuleFound( 'publicize' ),
			foundSharing = this.props.isModuleFound( 'sharedaddy' ),
			foundLikes = this.props.isModuleFound( 'likes' );

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if (
			! foundPublicize &&
			! foundSharing &&
			! foundLikes
		) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				{
					foundPublicize && (
						<Publicize
							{ ...commonProps }
						/>
					)
				}
				{
					foundSharing && (
						<ShareButtons
							{ ...commonProps }
						/>
					)
				}
				{
					foundLikes && (
						<Likes
							{ ...commonProps }
						/>
					)
				}
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			module: module_name => getModule( state, module_name ),
			settings: getSettings( state ),
			isDevMode: isDevMode( state ),
			isUnavailableInDevMode: module_name => isUnavailableInDevMode( state, module_name ),
			isModuleFound: ( module_name ) => _isModuleFound( state, module_name ),
			isLinked: isCurrentUserLinked( state ),
			connectUrl: getConnectUrl( state ),
			siteRawUrl: getSiteRawUrl( state ),
			siteAdminUrl: getSiteAdminUrl( state ),
			userCanManageModules: userCanManageModules( state ),
		};
	}
)( Sharing );
