/**
 * External dependencies
 */
import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { BarChart } from './bar-chart';
import getRecordInfo from './lib/record-info';
import createData from './lib/create-data';

import './style.scss';

/**
 * Generate Record Meter showing how many records the user has indexed
 *
 * @param {object} props - Props
 * @param {number} props.postCount - Post count
 * @param {object} props.postTypeBreakdown - Post type breakdown (post type => number of posts)
 * @param {number} props.tierMaximumRecords - Max number of records allowed in user's current tier
 * @returns {React.Component} RecordMeter React component
 */
export default function RecordMeter( { postCount, postTypeBreakdown, tierMaximumRecords } ) {
	// TODO: use setRecordInfo var
	// eslint-disable-next-line no-unused-vars
	const [ recordInfo, setRecordInfo ] = useState(
		getRecordInfo( createData().data, createData().planInfo )
	);

	return (
		<div className="jp-search-record-meter jp-search-dashboard-wrap" data-testid="record-meter">
			<div className="jp-search-dashboard-row">
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				<div className="jp-search-record-meter__title lg-col-span-8 md-col-span-6 sm-col-span-4">
					<h2>{ __( 'Your search records', 'jetpack-search-pkg' ) }</h2>
					{ tierMaximumRecords && (
						<div>
							<BarChart
								data={ recordInfo.data }
								isValid={ recordInfo.isValid }
								postTypeBreakdown={ postTypeBreakdown }
							/>
							Tier maximum records: <strong>{ tierMaximumRecords }</strong>
						</div>
					) }
					{ postCount && (
						<p>
							Post count: <strong>{ postCount }</strong>
						</p>
					) }
				</div>
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
			</div>
		</div>
	);
}
