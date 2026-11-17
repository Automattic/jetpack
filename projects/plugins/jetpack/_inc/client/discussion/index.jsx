import { __ } from '@wordpress/i18n';
import { Component } from 'react';
import { connect } from 'react-redux';
import QuerySite from 'components/data/query-site';
import { FeaturesPointer } from 'components/pointer-card';
import { isInSettingsPanel } from 'lib/settings-consolidation';
import {
	isOfflineMode,
	isUnavailableInOfflineMode,
	isCurrentUserLinked,
	getConnectUrl,
} from 'state/connection';
import {
	isOdysseyStatsEnabled,
	getSiteAdminUrl,
	isCommentBlocksAvailable,
} from 'state/initial-state';
import { getModule, getModuleOverride } from 'state/modules';
import { isModuleFound as _isModuleFound } from 'state/search';
import { getSettings } from 'state/settings';
import { Comments } from './comments';
import { CommentsMoved } from './comments-moved';

export class Discussion extends Component {
	static displayName = 'DiscussionSettings';

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isOdysseyStatsEnabled: this.props.isOdysseyStatsEnabled,
			isOfflineMode: this.props.isOfflineMode,
			isUnavailableInOfflineMode: this.props.isUnavailableInOfflineMode,
			siteAdminUrl: this.props.siteAdminUrl,
		};

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		const { isMovedToFeatures, searchTerm } = this.props,
			foundComments = this.props.isModuleFound( 'comments' ),
			foundMarkdown = this.props.isModuleFound( 'markdown' ),
			foundGravatar = this.props.isModuleFound( 'gravatar-hovercards' ),
			foundCommentLikes = this.props.isModuleFound( 'comment-likes' );

		// Once settings move out, admins find this tab's settings in Features, and only a search points there.
		// Markdown's pointer is on the Writing tab.
		const shown = isMovedToFeatures
			? !! searchTerm && ( foundComments || foundGravatar || foundCommentLikes )
			: foundComments || foundMarkdown || foundGravatar || foundCommentLikes;
		if ( ! shown ) {
			return null;
		}

		const pointTo = module => {
			const { name } = this.props.module( module );
			return (
				<FeaturesPointer header={ name } name={ name } search={ name } linksToSettings={ false } />
			);
		};

		return (
			<div>
				<QuerySite />
				<h1 className="screen-reader-text">{ __( 'Jetpack Discussion Settings', 'jetpack' ) }</h1>
				{ searchTerm && (
					<h2 className="jp-settings__section-title">{ __( 'Discussion', 'jetpack' ) }</h2>
				) }
				{ isMovedToFeatures ? (
					<>
						{ foundComments && <CommentsMoved getModule={ this.props.module } /> }
						{ foundGravatar && pointTo( 'gravatar-hovercards' ) }
						{ foundCommentLikes && pointTo( 'comment-likes' ) }
					</>
				) : (
					<Comments
						{ ...commonProps }
						isModuleFound={ this.props.isModuleFound }
						getModuleOverride={ this.props.getModuleOverride }
						hasBlockEditor={ this.props.hasBlockEditor }
					/>
				) }
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
		isMovedToFeatures: isInSettingsPanel( state ),
		connectUrl: getConnectUrl( state ),
		isLinked: isCurrentUserLinked( state ),
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
		isOdysseyStatsEnabled: isOdysseyStatsEnabled( state ),
		siteAdminUrl: getSiteAdminUrl( state ),
		hasBlockEditor: isCommentBlocksAvailable( state ),
	};
} )( Discussion );
