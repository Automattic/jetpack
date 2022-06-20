/* eslint-disable no-console */
import { __, sprintf } from '@wordpress/i18n';
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action.jsx';
import React, { useState } from 'react';

import './notice-box.scss';

const CLOSE_TO_LIMIT_PERCENT = 0.8;
const DISMISSED_NOTICES = 'jetpack-search-dismissed-notices';

const getNotices = ( tierMaximumRecords = null ) => {
	return {
		1: {
			id: 1,
			header: __( 'Search was unable to index your content', 'jetpack-search-pkg' ),
			message: __(
				"Jetpack's servers ran into a problem when trying to communicate with your site.",
				'jetpack-search-pkg'
			),
			isImportant: true,
		},
		2: {
			id: 2,
			header: __( 'Your content has not yet been indexed for Search', 'jetpack-search-pkg' ),
			message: __(
				'If you have recently set up Search, please allow a little time for indexing to complete.',
				'jetpack-search-pkg'
			),
		},
		3: {
			id: 3,
			header: __(
				"We weren't able to locate any content for Search to index",
				'jetpack-search-pkg'
			),
			message: __(
				"This can happen if you don't have any posts or pages yet.",
				'jetpack-search-pkg'
			),
		},
		4: {
			id: 4,
			header: __(
				"You're close to the maximum records for this billing tier",
				'jetpack-search-pkg'
			),
			message: sprintf(
				// translators: %s: site's current plan record limit
				__(
					"Once you hit %s indexed records, you'll be upgraded to the next tier. " +
						"You won't be charged for the new tier until your next billing date.",
					'jetpack-search-pkg'
				),
				tierMaximumRecords
			),
			link: {
				text: __( 'Learn more', 'jetpack-search-pkg' ),
				url: 'https://jetpack.com/support/search/product-pricing/',
			},
		},
	};
};

/**
 * Returns a notice box for displaying notices about record count and plan limits
 *
 * @param {object} props - Props
 * @param {number} props.recordCount - Current count of user's total records
 * @param {number} props.recordLimit - Max number of records allowed in user's current tier
 * @param {boolean} props.hasBeenIndexed - True if site has a last indexed date
 * @param {boolean} props.hasValidData - True if data is present and in valid form
 * @param {boolean} props.hasItems - True if there is at least one indexed record
 * @returns {React.Component} notice box component.
 */
export function NoticeBox( props ) {
	const activeNoticeIds = [];
	const NOTICES = getNotices( props.tierMaximumRecords );
	const [ showNotice, setShowNotice ] = useState( true );

	// deal with sessionStorage for ensuring dismissed notice boxes are not re-displayed
	const dismissedNoticesString = sessionStorage.getItem( DISMISSED_NOTICES ) ?? '';

	const DATA_NOT_VALID = '1',
		HAS_NOT_BEEN_INDEXED = '2',
		NO_INDEXABLE_ITEMS = '3',
		CLOSE_TO_LIMIT = '4';

	// check if data is valid
	props.hasValidData === false &&
		! dismissedNoticesString.includes( DATA_NOT_VALID ) &&
		activeNoticeIds.push( DATA_NOT_VALID );

	// check site has been indexed
	props.hasBeenIndexed === false &&
		! dismissedNoticesString.includes( HAS_NOT_BEEN_INDEXED ) &&
		activeNoticeIds.push( HAS_NOT_BEEN_INDEXED );

	// check at least one indexable item
	props.hasItems === false &&
		! dismissedNoticesString.includes( NO_INDEXABLE_ITEMS ) &&
		activeNoticeIds.push( NO_INDEXABLE_ITEMS );

	// check if close to reaching limit
	typeof props.tierMaximumRecords === 'number' &&
		props.recordCount > props.tierMaximumRecords * CLOSE_TO_LIMIT_PERCENT &&
		props.recordCount < props.tierMaximumRecords &&
		! dismissedNoticesString.includes( CLOSE_TO_LIMIT ) &&
		activeNoticeIds.push( CLOSE_TO_LIMIT );

	if ( activeNoticeIds.length < 1 || ! showNotice ) {
		return null;
	}

	const notice = NOTICES[ activeNoticeIds[ 0 ] ];

	const noticeBoxClassName = notice.isImportant
		? 'jp-search-notice-box jp-search-notice-box__important'
		: 'jp-search-notice-box';

	const dismissNoticeBox = () => {
		setShowNotice( false );
		if ( ! dismissedNoticesString.includes( notice.id ) ) {
			sessionStorage.setItem( DISMISSED_NOTICES, dismissedNoticesString + notice.id );
		}
	};

	return (
		<SimpleNotice
			isCompact={ false }
			status={ 'is-info' }
			className={ noticeBoxClassName }
			onDismissClick={ dismissNoticeBox }
			icon={ 'info-outline' }
		>
			{ notice.header && <h3 className="dops-notice__header">{ notice.header }</h3> }
			{ notice.message && <span className="dops-notice__body">{ notice.message }</span> }
			{ notice.link && (
				<NoticeAction href={ notice.link.url } external={ true }>
					{ notice.link.text }
				</NoticeAction>
			) }
		</SimpleNotice>
	);
}

export default NoticeBox;
