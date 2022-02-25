/**
 * External dependencies
 */
import React from 'react';

/**
 * Returns record count component showing curent records indexed and max records available for tier
 *
 * @param {object} props - current record count and plan record limit.
 * @returns {React.Component} record count component.
 */
export function RecordCount( props ) {
	if ( ! props.recordCount || ! props.planRecordLimit ) {
		return null;
	}

	return (
		<div data-testid="record-count" className="record-count">
			{ props.recordCount && props.planRecordLimit && (
				<p>
					{ props.recordCount } records indexed out of the { props.planRecordLimit } alloted for
					your current plan
				</p>
			) }
		</div>
	);
}
