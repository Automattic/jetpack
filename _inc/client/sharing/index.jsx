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
import { getSiteRawUrl, getSiteAdminUrl } from 'state/initial-state';
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
			siteAdminUrl: this.props.siteAdminUrl
		};

		const found = {
			publicize: this.props.isModuleFound( 'publicize' ),
			sharing: this.props.isModuleFound( 'sharedaddy' ),
			likes: this.props.isModuleFound( 'likes' )
		};

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if (
			! found.publicize &&
			! found.sharing &&
			! found.likes
		) {
			return null;
		}

		const publicizeSettings = (
			<Publicize
				{ ...commonProps }
			/>
		);

		const sharingSettings = (
			<ShareButtons
				{ ...commonProps }
			/>
		);

		const likesSettings = (
			<Likes
				{ ...commonProps }
			/>
		);

		return (
			<div>
				<QuerySite />
				{ found.publicize && publicizeSettings }
				{ found.sharing && sharingSettings }
				{ found.likes && likesSettings }
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
			siteAdminUrl: getSiteAdminUrl( state )
		};
	}
)( Sharing );
