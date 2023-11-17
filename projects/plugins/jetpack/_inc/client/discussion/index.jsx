import { __ } from '@wordpress/i18n';
import QuerySite from 'components/data/query-site';
import React from 'react';
import { connect } from 'react-redux';
import {
	isOfflineMode,
	isUnavailableInOfflineMode,
	isCurrentUserLinked,
	getConnectUrl,
} from 'state/connection';
import { isOdysseyStatsEnabled, isWoASite, getSiteAdminUrl } from 'state/initial-state';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { getSettings } from 'state/settings';
import { Comments } from './comments';

export class Discussion extends React.Component {
	static displayName = 'DiscussionSettings';

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isOdysseyStatsEnabled: this.props.isOdysseyStatsEnabled,
			isOfflineMode: this.props.isOfflineMode,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
			isWoASite: this.props.isWoASite,
			siteAdminUrl: this.props.siteAdminUrl,
		};

		const foundComments = this.props.isModuleFound( 'comments' ),
			foundMarkdown = this.props.isModuleFound( 'markdown' ),
			foundGravatar = this.props.isModuleFound( 'gravatar-hovercards' ),
			foundCommentLikes = this.props.isModuleFound( 'comment-likes' );

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if ( ! foundComments && ! foundMarkdown && ! foundGravatar && ! foundCommentLikes ) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<h1 className="screen-reader-text">{ __( 'Jetpack Discussion Settings', 'jetpack' ) }</h1>
				<h2 className="jp-settings__section-title">
					{ this.props.searchTerm
						? __( 'Discussion', 'jetpack' )
						: __( 'Manage advanced comment settings.', 'jetpack' ) }
				</h2>
				<Comments
					{ ...commonProps }
					isModuleFound={ this.props.isModuleFound }
					getModuleOverride={ this.props.getModuleOverride }
				/>
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
		connectUrl: getConnectUrl( state ),
		isLinked: isCurrentUserLinked( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
		isOdysseyStatsEnabled: isOdysseyStatsEnabled( state ),
		isWoASite: isWoASite( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
	};
} )( Discussion );
