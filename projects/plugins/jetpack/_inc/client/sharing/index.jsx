import { __ } from '@wordpress/i18n';
import QuerySite from 'components/data/query-site';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
	isOfflineMode,
	isUnavailableInOfflineMode,
	isCurrentUserLinked,
	getConnectUrl,
} from 'state/connection';
import {
	currentThemeIsBlockTheme,
	getSiteRawUrl,
	getSiteAdminUrl,
	userCanManageModules,
	isAtomicSite,
	isSharingBlockAvailable,
	getSiteId,
} from 'state/initial-state';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { getSettings } from 'state/settings';
import { siteHasFeature, getActiveFeatures, siteUsesWpAdminInterface } from 'state/site';
import { Likes } from './likes';
import { Publicize } from './publicize';
import { ShareButtons } from './share-buttons';

class Sharing extends Component {
	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isOfflineMode: this.props.isOfflineMode,
			siteUsesWpAdminInterface: this.props.siteUsesWpAdminInterface,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
			isLinked: this.props.isLinked,
			connectUrl: this.props.connectUrl,
			siteRawUrl: this.props.siteRawUrl,
			blogID: this.props.blogID,
			siteAdminUrl: this.props.siteAdminUrl,
			userCanManageModules: this.props.userCanManageModules,
			activeFeatures: this.props.activeFeatures,
			hasSocialBasicFeatures: this.props.hasSocialBasicFeatures,
			hasSocialAdvancedFeatures: this.props.hasSocialAdvancedFeatures,
			hasSocialImageGenerator: this.props.hasSocialImageGenerator,
			hasAutoConversion: this.props.hasAutoConversion,
			isAtomicSite: this.props.isAtomicSite,
			hasSharingBlock: this.props.hasSharingBlock,
			isBlockTheme: this.props.isBlockTheme,
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
				<h2 className="jp-settings__section-title">
					{ this.props.searchTerm
						? __( 'Sharing', 'jetpack' )
						: __(
								'Share your content to social media, reaching new audiences and increasing engagement.',
								'jetpack'
						  ) }
				</h2>
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
		siteUsesWpAdminInterface: siteUsesWpAdminInterface( state ),
		isUnavailableInOfflineMode: module_name => isUnavailableInOfflineMode( state, module_name ),
		isModuleFound: module_name => _isModuleFound( state, module_name ),
		isLinked: isCurrentUserLinked( state ),
		connectUrl: getConnectUrl( state ),
		siteRawUrl: getSiteRawUrl( state ),
		blogID: getSiteId( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
		hasSocialBasicFeatures: siteHasFeature( state, 'social-shares-1000' ),
		activeFeatures: getActiveFeatures( state ),
		hasSocialAdvancedFeatures: siteHasFeature( state, 'social-enhanced-publishing' ),
		hasSocialImageGenerator: siteHasFeature( state, 'social-image-generator' ),
		hasAutoConversion: siteHasFeature( state, 'social-image-auto-convert' ),
		userCanManageModules: userCanManageModules( state ),
		isAtomicSite: isAtomicSite( state ),
		hasSharingBlock: isSharingBlockAvailable( state ),
		isBlockTheme: currentThemeIsBlockTheme( state ),
	};
} )( Sharing );
