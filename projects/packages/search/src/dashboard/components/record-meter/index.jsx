/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

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
	return (
		<div className="jp-search-record-meter jp-search-dashboard-wrap">
			<div className="jp-search-dashboard-row">
				<div className="jp-search-record-meter__title lg-col-span-8 md-col-span-6 sm-col-span-4">
					<h2>{ __( 'Your search records', 'jetpack-search-pkg' ) }</h2>
					{ tierMaximumRecords && (
						<p>
							Tier maximum records: <strong>{ tierMaximumRecords }</strong>
						</p>
					) }
					{ postCount && (
						<p>
							Post count: <strong>{ postCount }</strong>
						</p>
					) }
					{ postTypeBreakdown && (
						<p>
							Post type breakdown:
							<table>
								{ Object.entries( postTypeBreakdown ).map( postType => (
									<tr>
										<td>{ postType[ 0 ] }</td>
										<td>
											<strong>{ postType[ 1 ] }</strong>
										</td>
									</tr>
								) ) }
							</table>
						</p>
					) }
				</div>
				<div className="lg-col-span-2 md-col-span-1 sm-col-span-0"></div>
			</div>
		</div>
	);
}
