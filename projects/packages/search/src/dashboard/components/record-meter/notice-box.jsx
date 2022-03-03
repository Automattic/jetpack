/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

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

	// check if current indexed items is over, their plan limit
	// note: this currently hard codes in the number of records for the next tier.
	// will need to be updated once this plan data is fetchable via API

	if ( props.recordCount > props.planRecordLimit ) {
		notices.push( {
			message:
				__( 'You recently surpassed ', 'jetpack-search-pkg' ) +
				props.planRecordLimit +
				__(
					' records and will be automatically upgraded to the next billing tier of ',
					'jetpack-search-pkg'
				) +
				props.planRecordLimit * 10 +
				__( ' max records. Learn more.', 'jetpack-search-pkg' ),
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
				__(
					'You’re close to the max amount of records for this billing tier. Once you hit ',
					'jetpack-search-pkg'
				) +
				props.planRecordLimit +
				__(
					' indexed records, you’ll automatically be billed in the next tier. Learn more.',
					'jetpack-search-pkg'
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
