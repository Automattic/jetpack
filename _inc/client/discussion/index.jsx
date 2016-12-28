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
import QuerySite from 'components/data/query-site';
import { Comments } from './comments';
import { Subscriptions } from './subscriptions';

export const Discussion = React.createClass( {
	displayName: 'DiscussionSettings',

	render() {
		return (
			<div>
				<QuerySite />
				<Comments
					settings={ this.props.settings }
					getModule={ this.props.module }
				/>
				<Subscriptions
					settings={ this.props.settings }
					getModule={ this.props.module }
					siteRawUrl={ this.props.siteRawUrl }
				/>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			module: ( module_name ) => getModule( state, module_name ),
			settings: getSettings( state )
		}
	}
)( Discussion );
