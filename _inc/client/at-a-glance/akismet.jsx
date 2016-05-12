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
				<DashItem label="Anti-spam (Akismet)">
					<p className="jp-dash-item__description">Loading&#8230;</p>
				</DashItem>
			);
		}

		if ( akismetData === 'not_installed' ) {
			return(
				<DashItem label="Anti-spam (Akismet)" className="jp-dash-item__is-inactive">
					<p className="jp-dash-item__description"><a href="#">Install Akismet (null)</a> to automatically block spam comments and more.</p>
				</DashItem>
			);
		}

		if ( akismetData === 'invalid_key' ) {
			return(
				<DashItem label="Anti-spam (Akismet)" className="jp-dash-item__is-inactive" status="is-warning">
					<p className="jp-dash-item__description">
						Whoops! It appears your Akismet key is missing or invalid. <br/>
						<a href="#">Go to Akismet settings to fix (null)</a></p>
				</DashItem>
			);
		}

		if ( akismetData === 'not_active' ) {
			return(
				<DashItem label="Anti-spam (Akismet)" className="jp-dash-item__is-inactive">
					<p className="jp-dash-item__description"><a href="#">Activate Akismet (null)</a> to automatically block spam comments and more.</p>
				</DashItem>
			);
		}

		return(
			<DashItem label="Anti-spam (Akismet)" status="is-working">
				<h2 className="jp-dash-item__count">{ akismetData.all.spam }</h2>
				<p className="jp-dash-item__description">Spam comments blocked.</p>
				{/* 
				<strong>This is the data we could show here: </strong> <br/>
				Spam blocked all-time: { akismetData.all.spam } <br/>
				Time saved ( in seconds ): { akismetData.all.time_saved } <br/>
				Accuracy: { akismetData.all.accuracy } <br/>
				false positives: { akismetData.all.false_positives } 
				*/}
			</DashItem>
		);
	},

	render: function() {
		return(
			<div className="jp-dash-item__interior">
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
