/**
 * External dependencies
 */
import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_ID } from 'store';
import { BarChart } from './bar-chart';
import { RecordCount } from './record-count';
import { NoticeBox } from './notice-box';
import getRecordInfo from './lib/record-info';
import createData from './lib/create-data';

import './style.scss';

/**
 * Generate Record Meter showing how many records the user has indexed
 *
 * @returns {React.Component} RecordMeter React component
 */
export default function RecordMeter() {
	const tierMaximumRecords = useSelect( select => select( STORE_ID ).getTierMaximumRecords() );

	const [ recordInfo, setRecordInfo ] = useState(
		// eslint-disable-line no-unused-vars
		getRecordInfo( createData().data, createData().planInfo )
	);

	return (
		<div className="jp-search-record-meter jp-search-dashboard-wrap">
			<div className="jp-search-dashboard-row">
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
				<div className="jp-search-record-meter__title lg-col-span-8 md-col-span-6 sm-col-span-4">
					<h2>{ __( 'Your search records', 'jetpack-search-pkg' ) }</h2>
					{ tierMaximumRecords && (
						<p>
							<RecordCount
								recordCount={ recordInfo.recordCount }
								planRecordLimit={ tierMaximumRecords }
							/>
							<BarChart data={ recordInfo.data } isValid={ recordInfo.isValid } />
							<NoticeBox
								recordCount={ recordInfo.recordCount }
								planRecordLimit={ tierMaximumRecords }
								hasBeenIndexed={ recordInfo.hasBeenIndexed }
								hasValidData={ recordInfo.hasValidData }
								hasItems={ recordInfo.hasItems }
							></NoticeBox>
						</p>
					) }
				</div>
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
			</div>
		</div>
	);
}
