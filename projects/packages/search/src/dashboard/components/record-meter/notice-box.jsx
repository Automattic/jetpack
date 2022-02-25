/**
 * External dependencies
 */
import React from 'react';

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
			message: 'We weren’t able to properly locate your content for Search',
			isImportant: true,
		} );
	}

	// check site has been indexed
	if ( props.hasBeenIndexed === false ) {
		notices.push( { message: 'Your content has not yet been indexed for Search' } );
	}

	// check at least one indexable item
	if ( props.hasItems === false ) {
		notices.push( {
			message:
				"We weren’t able to locate any content to Search to index. Perhaps you don't yet have any posts or pages?",
		} );
	}

	// check if current indexed items is over, their plan limit
	// note: this currently hard codes in the number of records for the next tier.
	// will need to be updated once this plan data is fetchable via API

	if ( props.recordCount > props.planRecordLimit ) {
		notices.push( {
			message:
				'You recently surpassed ' +
				props.planRecordLimit +
				' records and will be automatically upgraded to the next billing tier of ' +
				props.planRecordLimit * 10 +
				' max records. Learn more.',
		} );
	}

	// check if current indexed items is getting close to.
	// currently calculates when at 80% of usage
	if (
		props.recordCount > props.planRecordLimit * 0.8 &&
		props.recordCount < props.planRecordLimit
	) {
		notices.push( {
			message:
				'You’re close to the max amount of records for this billing tier. Once you hit ' +
				props.planRecordLimit +
				' indexed records, you’ll automatically be billed in the next tier. Learn more.',
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
