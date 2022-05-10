/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';

/**
 * Returns record count component showing current records indexed and max records available for tier.
 *
 * @param {object} props - current record count and plan record limit.
 * @returns {React.Component} record count component.
 */
export function RecordCount( props ) {
	if ( ! props.recordCount ) {
		return null;
	}

	const recordCount =
		typeof props.recordCount === 'number' ? props.recordCount?.toLocaleString() : props.recordCount;

	const recordLimit =
		typeof props.tierMaximumRecords === 'number'
			? props.tierMaximumRecords?.toLocaleString()
			: props.tierMaximumRecords;

	let message;

	if ( recordLimit ) {
		message = createInterpolateElement(
			sprintf(
				// translators: %1$s: site's current record count, %2$s: record limit of the current plan
				__(
					'<s>%1$s</s> records indexed out of the <s>%2$s</s> allotted for your current plan',
					'jetpack-search-pkg'
				),
				recordCount,
				recordLimit
			),
			{
				s: <strong />,
			}
		);
	} else {
		message = createInterpolateElement(
			sprintf(
				// translators: %1$s: site's current record count, %2$s: record limit of the current plan
				__( '<s>%1$s</s> records indexed', 'jetpack-search-pkg' ),
				recordCount
			),
			{
				s: <strong />,
			}
		);
	}

	return (
		<div data-testid="record-count" className="jp-search-record-count">
			<p>{ message }</p>
		</div>
	);
}
