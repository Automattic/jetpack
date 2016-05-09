/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import DashSectionHeader from 'components/dash-section-header';

/**
 * Internal dependencies
 */
import QueryAkismetData from 'components/data/query-akismet-data';
import {
	getAkismetData as _getAkismetData
} from 'state/at-a-glance';

const DashAkismet = React.createClass( {
	getContent: function() {
		const akismetData = this.props.getAkismetData();

		if ( akismetData === 'N/A' ) {
			return(
				<DashItem label="Anti-spam">
					Loading...
				</DashItem>
			);
		}

		return(
			<DashItem label="Anti-spam" status="is-working">
				<strong>This is the data we could show here: </strong> <br/>
				Spam blocked all-time: { akismetData.all.spam } <br/>
				Time saved ( in seconds ): { akismetData.all.time_saved } <br/>
				Accuracy: { akismetData.all.accuracy } <br/>
				false positives: { akismetData.all.false_positives }
			</DashItem>
		);

		return(
			<DashItem label="Anti-spam">
				Akismet is not on. <a href="#">Do Something!</a>
			</DashItem>
		);
	},

	render: function() {
		return(
			<div>
				<QueryAkismetData />
				{ this.getContent() }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			getAkismetData: () => _getAkismetData( state )
		};
	}
)( DashAkismet );