/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import QuerySite from 'components/data/query-site';
import Comments from './comments';
import Subscriptions from './subscriptions';

export const Discussion = React.createClass( {
	displayName: 'DiscussionSettings',

	render() {
		return (
			<div>
				<QuerySite />
				<Comments />
				<Subscriptions siteRawUrl={ this.props.siteRawUrl } />
			</div>
		);
	}
} );
