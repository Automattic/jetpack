/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import { getModule, getModuleOverride } from 'state/modules';
import { getSettings } from 'state/settings';
import { isDevMode, isUnavailableInDevMode, isCurrentUserLinked } from 'state/connection';
import { isModuleFound as _isModuleFound } from 'state/search';
import QuerySite from 'components/data/query-site';
import { Comments } from './comments';
import { Subscriptions } from './subscriptions';
import { getConnectUrl } from 'state/connection';

export class Discussion extends React.Component {
	static displayName = 'DiscussionSettings';

	render() {
		const commonProps = {
			settings: this.props.settings,
			getModule: this.props.module,
			isDevMode: this.props.isDevMode,
			isUnavailableInDevMode: this.props.isUnavailableInDevMode
		};

		const foundComments = this.props.isModuleFound( 'comments' ),
			foundMarkdown = this.props.isModuleFound( 'markdown' ),
			foundGravatar = this.props.isModuleFound( 'gravatar-hovercards' ),
			foundSubscriptions = this.props.isModuleFound( 'subscriptions' ),
			foundCommentLikes = this.props.isModuleFound( 'comment-likes' );

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if ( ! foundComments && ! foundSubscriptions && ! foundMarkdown && ! foundGravatar && ! foundCommentLikes ) {
			return null;
		}

		return (
			<div>
				<QuerySite />

				<Card
					title={ __( 'Open your site to comments and invite subscribers to get alerts about your latest work.' ) }
					className="jp-settings-description"
				/>

				<Comments
					{ ...commonProps }
					isModuleFound={ this.props.isModuleFound }
					getModuleOverride={ this.props.getModuleOverride }
				/>
				{
					foundSubscriptions && (
						<Subscriptions
							{ ...commonProps }
							isLinked={ this.props.isLinked }
							connectUrl={ this.props.connectUrl }
							siteRawUrl={ this.props.siteRawUrl }
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
			connectUrl: getConnectUrl( state ),
			isLinked: isCurrentUserLinked( state ),
			getModuleOverride: module_name => getModuleOverride( state, module_name ),
		};
	}
)( Discussion );
