/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Returns record count component showing current records indexed and max records available for tier.
 *
 * @param {object} props - current record count and plan record limit.
 * @returns {React.Component} record count component.
 */
export function RecordCount( props ) {
	if ( ! props.recordCount || ! props.planRecordLimit ) {
		return null;
	}

	return (
		<div data-testid="record-count" className="jp-search-record-count">
			<p>
				{ sprintf(
					// translators: %1$d: site's current record count, %2$d: record limit of the current plan
					__(
						'%1$d records indexed out of the %2$d allotted for your current plan',
						'jetpack-search-pkg'
					),
					props.recordCount,
					props.planRecordLimit
				) }
			</p>
		</div>
	);
}
