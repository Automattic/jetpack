/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { getModule as _getModule } from 'state/modules';
import { getSettings as _getSettings } from 'state/settings';
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
					settings={ this.props.getSettings() }
					getModule={ this.props.getModule }
				/>
				<Subscriptions
					settings={ this.props.getSettings() }
					getModule={ this.props.getModule }
					siteRawUrl={ this.props.siteRawUrl }
				/>
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			getModule: ( module_name ) => _getModule( state, module_name ),
			getSettings: () => _getSettings( state )
		}
	},
	( dispatch ) => {
		return {};
	}
)( Discussion );
