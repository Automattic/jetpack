/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getModule } from 'state/modules';
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
			foundGravatar = this.props.isModuleFound( 'gravatar-hovercards' ),
			foundSubscriptions = this.props.isModuleFound( 'subscriptions' ),
			foundCommentLikes = this.props.isModuleFound( 'comment-likes' );

		if ( ! this.props.searchTerm && ! this.props.active ) {
			return null;
		}

		if ( ! foundComments && ! foundSubscriptions && ! foundGravatar && ! foundCommentLikes ) {
			return null;
		}

		return (
			<div>
				<QuerySite />
				<Comments
					{ ...commonProps }
					isModuleFound={ this.props.isModuleFound }
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
			isLinked: isCurrentUserLinked( state )
		};
	}
)( Discussion );
