import { __ } from '@wordpress/i18n';
import Card from 'components/card';
import QuerySite from 'components/data/query-site';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
	isOfflineMode,
	isUnavailableInOfflineMode,
	isCurrentUserLinked,
	getConnectUrl,
} from 'state/connection';
import { getSiteRawUrl, getSiteAdminUrl, userCanManageModules } from 'state/initial-state';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { getSettings } from 'state/settings';
import { Likes } from './likes';
import { Publicize } from './publicize';
import { ShareButtons } from './share-buttons';

class Sharing extends Component {
	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isOfflineMode: this.props.isOfflineMode,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
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

		if ( ! foundPublicize && ! foundSharing && ! foundLikes ) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<h1 className="screen-reader-text">{ __( 'Jetpack Sharing Settings', 'jetpack' ) }</h1>
				<Card
					title={
						this.props.searchTerm
							? __( 'Sharing', 'jetpack' )
							: __(
									'Share your content to social media, reaching new audiences and increasing engagement.',
									'jetpack'
							  )
					}
					className="jp-settings-description"
				/>
				{ foundPublicize && <Publicize { ...commonProps } /> }
				{ foundSharing && <ShareButtons { ...commonProps } /> }
				{ foundLikes && <Likes { ...commonProps } /> }
			</div>
		);
	}
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		settings: getSettings( state ),
		isOfflineMode: isOfflineMode( state ),
		isUnavailableInOfflineMode: module_name => isUnavailableInOfflineMode( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
		isLinked: isCurrentUserLinked( state ),
		connectUrl: getConnectUrl( state ),
		siteRawUrl: getSiteRawUrl( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
		userCanManageModules: userCanManageModules( state ),
	};
} )( Sharing );
