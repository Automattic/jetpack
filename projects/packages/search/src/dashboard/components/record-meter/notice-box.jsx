/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Returns a notice box for displaying notices about record count and plan limits
 *
 * @param {object} props - record count, record limit, hasbeenindexed, hasvaliddata, hasItems
 * @returns {React.Component} notice box component.
 */
export function NoticeBox( props ) {
	const notices = [];

	// check data is valid
	if ( props.hasValidData === false ) {
		notices.push( {
			message: __(
				"We weren't able to properly locate your content for Search",
				'jetpack-search-pkg'
			),
			isImportant: true,
		} );
	}

	// check site has been indexed
	if ( props.hasBeenIndexed === false ) {
		notices.push( {
			message: __( 'Your content has not yet been indexed for Search', 'jetpack-search-pkg' ),
		} );
	}

	// check at least one indexable item
	if ( props.hasItems === false ) {
		notices.push( {
			message: __(
				"We weren't able to locate any content to Search to index. Perhaps you don't yet have any posts or pages?",
				'jetpack-search-pkg'
			),
		} );
	}

	if ( props.recordCount > props.planRecordLimit ) {
		notices.push( {
			message: sprintf(
				// translators: %1$d: site's current plan record limit, %2$d: record limit of the next plan up
				__(
					'You recently surpassed %1$d records and will be automatically upgraded to the next billing tier of %2$d max records',
					'jetpack-search-pkg'
				),
				props.planRecordLimit,
				props.planRecordLimit * 10 //TODO: this is currently hard coded & incorrect. Needs to have the next tier plan record limit added
			),
		} );
	}

	if (
		props.recordCount > props.planRecordLimit * 0.8 && //TODO: currently 'close' is defined as 80%. This has not been decided/finalised to be the best number here yet
		props.recordCount < props.planRecordLimit
	) {
		notices.push( {
			message: sprintf(
				// translators: %d: site's current plan record limit
				__(
					"You're close to the max amount of records for this billing tier. Once you hit %d indexed records, you'll automatically be billed in the next tier",
					'jetpack-search-pkg'
				),
				props.planRecordLimit
			),
		} );
	}

	if ( ! notices || notices.length < 1 ) {
		return null;
	}

	const noticeBoxClassName = notices[ 0 ].isImportant ? 'notice-box-red' : 'notice-box';

	return (
		<div data-testid="notice" className={ noticeBoxClassName }>
			<p>{ notices[ 0 ].message }</p>
		</div>
	);
}

export default NoticeBox;
