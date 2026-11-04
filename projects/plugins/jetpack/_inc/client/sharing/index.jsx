import { __, _x } from '@wordpress/i18n';
import { Component } from 'react';
import { connect } from 'react-redux';
import QuerySite from 'components/data/query-site';
import { FeaturesPointer } from 'components/pointer-card';
import { isSettingsConsolidationEnabled } from 'lib/settings-consolidation';
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
	isSharingBlockAvailable,
	isLikeBlockAvailable,
	getSiteId,
} from 'state/initial-state';
import { getModule } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { getSettings } from 'state/settings';
import { getActiveFeatures } from 'state/site';
import { Likes } from './likes';
import { Publicize } from './publicize';
import { ShareButtons } from './share-buttons';

export class Sharing extends Component {
	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isOfflineMode: this.props.isOfflineMode,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
			isLinked: this.props.isLinked,
			connectUrl: this.props.connectUrl,
			siteRawUrl: this.props.siteRawUrl,
			blogID: this.props.blogID,
			siteAdminUrl: this.props.siteAdminUrl,
			userCanManageModules: this.props.userCanManageModules,
			activeFeatures: this.props.activeFeatures,
			hasSharingBlock: this.props.hasSharingBlock,
			hasLikeBlock: this.props.hasLikeBlock,
			isBlockTheme: this.props.isBlockTheme,
		};

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		// Once settings move out, admins find Social in Features, and a search here points them there.
		const socialInFeatures = isSettingsConsolidationEnabled() && this.props.userCanManageModules,
			foundPublicize =
				this.props.isModuleFound( 'publicize' ) &&
				( ! socialInFeatures || !! this.props.searchTerm ),
			foundSharing = this.props.isModuleFound( 'sharedaddy' ),
			foundLikes = this.props.isModuleFound( 'likes' );

		if ( ! foundPublicize && ! foundSharing && ! foundLikes ) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<h1 className="screen-reader-text">{ __( 'Jetpack Sharing Settings', 'jetpack' ) }</h1>
				{ this.props.searchTerm && (
					<h2 className="jp-settings__section-title">{ __( 'Sharing', 'jetpack' ) }</h2>
				) }
				{ foundPublicize &&
					( socialInFeatures ? (
						<FeaturesPointer
							header={ _x( 'Jetpack Social', 'Settings header', 'jetpack' ) }
							name="Jetpack Social"
							search="social"
						/>
					) : (
						<Publicize { ...commonProps } />
					) ) }
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
		blogID: getSiteId( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
		activeFeatures: getActiveFeatures( state ),
		userCanManageModules: userCanManageModules( state ),
		hasSharingBlock: isSharingBlockAvailable( state ),
		hasLikeBlock: isLikeBlockAvailable( state ),
		isBlockTheme: currentThemeIsBlockTheme( state ),
	};
} )( Sharing );
