import { __ } from '@wordpress/i18n';
import React, { useState } from 'react';
import { BarChart } from './bar-chart';
import getRecordInfo from './lib/record-info';
import { NoticeBox } from './notice-box';
import { RecordCount } from './record-count';

import './style.scss';

/**
 * Generate Record Meter showing how many records the user has indexed
 *
 * @param {object} props - Props
 * @param {number} props.postCount - Post count number of posts in total
 * @param {object} props.postTypeBreakdown - Post type breakdown (post type => number of posts)
 * @param {number} props.tierMaximumRecords - Max number of records allowed in user's current tier
 * @param {string} props.lastIndexedDate - The date on which the site was last indexed in ISO 8601 format
 * @returns {React.Component} RecordMeter React component
 */
export default function RecordMeter( {
	postCount,
	postTypeBreakdown,
	tierMaximumRecords,
	lastIndexedDate,
} ) {
	// TODO: use setRecordInfo var
	// eslint-disable-next-line no-unused-vars
	const [ recordInfo, setRecordInfo ] = useState(
		getRecordInfo( postCount, postTypeBreakdown, tierMaximumRecords, lastIndexedDate )
	);

	return (
		<div className="jp-search-record-meter jp-search-dashboard-wrap" data-testid="record-meter">
			<div className="jp-search-dashboard-row">
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				<div className="jp-search-record-meter__content lg-col-span-8 md-col-span-6 sm-col-span-4">
					<h2>
						{
							/* translators: 'Your search index' is a breakdown of the site's indexed post type content,
					such as the number of indexed posts, pages etc. */ __(
								'Your search index',
								'jetpack-search-pkg'
							)
						}
					</h2>
					<div>
						<RecordCount
							recordCount={ recordInfo.recordCount }
							tierMaximumRecords={ tierMaximumRecords }
						/>
						<BarChart
							data={ recordInfo.data }
							isValid={ recordInfo.isValid }
							postTypeBreakdown={ postTypeBreakdown }
						/>
						<NoticeBox
							recordCount={ recordInfo.recordCount }
							tierMaximumRecords={ tierMaximumRecords }
							hasBeenIndexed={ recordInfo.hasBeenIndexed }
							hasValidData={ recordInfo.hasValidData }
							hasItems={ recordInfo.hasItems }
						></NoticeBox>
					</div>
				</div>
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
			</div>
		</div>
	);
}
