/* eslint-disable no-console */
/**
 * External dependencies
 */
import React, { useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import SimpleNotice from 'components/notice';
import NoticeAction from 'components/notice/notice-action.jsx';

const CLOSE_TO_LIMIT_PERCENT = 0.8;
const DISMISSED_NOTICES = 'jetpack-search-dismissed-notices';

const getNotices = ( planRecordLimit = null ) => {
	return {
		1: {
			id: 1,
			message: __(
				"We weren't able to properly locate your content for Search",
				'jetpack-search-pkg'
			),
			isImportant: true,
		},
		2: {
			id: 2,
			message: __( 'Your content has not yet been indexed for Search', 'jetpack-search-pkg' ),
		},
		3: {
			id: 3,
			message: __(
				"We weren't able to locate any content for Search to index. Perhaps you don't yet have any posts or pages?",
				'jetpack-search-pkg'
			),
		},
		4: {
			id: 4,
			message: sprintf(
				// translators: %s: site's current plan record limit
				__(
					'You recently surpassed %d records and will be automatically upgraded to the next billing tier',
					'jetpack-search-pkg'
				),
				planRecordLimit
			),
			link: {
				text: __( 'learn more', 'jetpack-search-pkg' ),
				url: 'https://jetpack.com/support/search/product-pricing/',
			},
		},
		5: {
			id: 5,
			message: sprintf(
				// translators: %s: site's current plan record limit
				__(
					"You're close to the max amount of records for this billing tier. Once you hit %s indexed records, you'll automatically be billed for the next tier",
					'jetpack-search-pkg'
				),
				planRecordLimit
			),
			link: {
				text: __( 'learn more', 'jetpack-search-pkg' ),
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
	const NOTICES = getNotices( props.planRecordLimit );
	const [ showNotice, setShowNotice ] = useState( true );

	// deal with localStorage for ensuring dismissed notice boxs are not re-displayed
	const dismissedNoticesString = localStorage.getItem( DISMISSED_NOTICES ) ?? '';

	// check if data is valid
	props.hasValidData === false &&
		! dismissedNoticesString.includes( '1' ) &&
		activeNoticeIds.push( '1' );

	// check site has been indexed
	props.hasBeenIndexed === false &&
		! dismissedNoticesString.includes( '2' ) &&
		activeNoticeIds.push( '2' );

	// check at least one indexable item
	props.hasItems === false &&
		! dismissedNoticesString.includes( '3' ) &&
		activeNoticeIds.push( '3' );

	// check if over limit
	props.recordCount > props.planRecordLimit &&
		! dismissedNoticesString.includes( '4' ) &&
		activeNoticeIds.push( '4' );

	// check if close to reaching limit
	props.recordCount > props.planRecordLimit * CLOSE_TO_LIMIT_PERCENT &&
		props.recordCount < props.planRecordLimit &&
		! dismissedNoticesString.includes( '5' ) &&
		activeNoticeIds.push( '5' );

	if ( ! activeNoticeIds || activeNoticeIds.length < 1 || ! showNotice ) {
		return null;
	}

	const notice = NOTICES[ activeNoticeIds[ 0 ] ];

	const noticeBoxClassName = notice.isImportant
		? 'jp-search-notice-box jp-search-notice-box__important'
		: 'jp-search-notice-box';

	const dismissNoticeBox = () => {
		setShowNotice( false );
		if ( ! dismissedNoticesString.includes( notice.id ) ) {
			localStorage.setItem( DISMISSED_NOTICES, dismissedNoticesString + notice.id );
		}
	};

	return (
		<SimpleNotice
			isCompact={ false }
			status={ 'is-info' }
			className={ noticeBoxClassName }
			onDismissClick={ dismissNoticeBox }
		>
			{ notice.message }
			{ notice.link && (
				<NoticeAction href={ notice.link.url } external={ true }>
					{ notice.link.text }
				</NoticeAction>
			) }
		</SimpleNotice>
	);
}

export default NoticeBox;
