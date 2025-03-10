import { Col, getRedirectUrl, Text } from '@automattic/jetpack-components';
import { getSettings as getDateSettings, dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect, useCallback } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import { applyTimezone } from '../../utils/apply-timezone';
import createCookie from '../../utils/create-cookie';
import preventWidows from '../../utils/prevent-widows';
import useAnalytics from '../use-analytics';
import { useGetReadableFailedBackupReason } from './use-get-readable-failed-backup-reason';
import type { NoticeOptions } from '../../context/notices/types';

type RedBubbleAlerts = Window[ 'myJetpackInitialState' ][ 'redBubbleAlerts' ];

const useBackupNeedsAttentionNotice = ( redBubbleAlerts: RedBubbleAlerts ) => {
	const { recordEvent } = useAnalytics();
	const { setNotice, resetNotice } = useContext( NoticeContext );

	const {
		type,
		data: { status, last_updated: lastUpdated },
	} = redBubbleAlerts?.backup_failure || { type: 'error', data: {} };
	const { text: errorDescription } = useGetReadableFailedBackupReason() || {};

	const {
		timezone: { offset },
	} = getDateSettings() || { offset: '0' };
	// Using dateI18n() to apply internationalization and formatting.
	const backupStatusLastUpdatedDate = dateI18n(
		'F jS, Y g:ia',
		applyTimezone( lastUpdated, parseInt( offset ) )
	);

	const troubleshootBackupsUrl = getRedirectUrl( 'jetpack-support-troubleshooting-backup' );
	const contactSupportUrl = getRedirectUrl( 'jetpack-support' );

	const noticeTitle = __( 'Oops! We couldn’t back up your site', 'jetpack-my-jetpack' );

	const onCloseClick = useCallback( () => {
		createCookie( 'backup_failure_dismissed', 7 );
		delete redBubbleAlerts.backup_failure;
		resetNotice();
	}, [ redBubbleAlerts.backup_failure, resetNotice ] );

	const onPrimaryCtaClick = useCallback( () => {
		window.open( troubleshootBackupsUrl );
		recordEvent( 'jetpack_my_jetpack_backup_needs_attention_notice_primary_cta_click', {
			backup_status: status,
		} );
	}, [ recordEvent, status, troubleshootBackupsUrl ] );

	const onSecondaryCtaClick = useCallback( () => {
		window.open( contactSupportUrl );
		recordEvent( 'jetpack_my_jetpack_backup_needs_attention_notice_secondary_cta_click', {
			backup_status: status,
		} );
	}, [ recordEvent, status, contactSupportUrl ] );

	useEffect( () => {
		if ( ! redBubbleAlerts?.backup_failure ) {
			return;
		}

		const noticeMessage = (
			<Col>
				<Text mb={ 1 }>
					{ preventWidows(
						sprintf(
							// Translators: %1$s is the date the last backup took place, i.e.- "Dec 7, 2024"
							__( 'The last backup attempted on %1$s was unsuccessful.', 'jetpack-my-jetpack' ),
							backupStatusLastUpdatedDate
						)
					) }
				</Text>
				{ errorDescription && (
					<Text mb={ 1 }>{ preventWidows( errorDescription as string ) }</Text>
				) }
				<Text mb={ 1 }>
					{ preventWidows(
						__(
							'Check out our troubleshooting guide or contact your hosting provider to resolve the issue.',
							'jetpack-my-jetpack'
						)
					) }
				</Text>
			</Col>
		);

		const noticeOptions: NoticeOptions = {
			id: 'backup-needs-attention-notice',
			level: type,
			actions: [
				{
					label: __( 'Read troubleshooting guide', 'jetpack-my-jetpack' ),
					onClick: onPrimaryCtaClick,
					noDefaultClasses: true,
				},
				{
					label: __( 'Contact support', 'jetpack-my-jetpack' ),
					onClick: onSecondaryCtaClick,
					isExternalLink: true,
				},
			],
			onClose: onCloseClick,
			hideCloseButton: false,
			priority: NOTICE_PRIORITY_HIGH,
		};

		setNotice( {
			title: noticeTitle,
			message: noticeMessage,
			options: noticeOptions,
		} );
	}, [
		redBubbleAlerts,
		setNotice,
		recordEvent,
		onCloseClick,
		onPrimaryCtaClick,
		onSecondaryCtaClick,
		noticeTitle,
		backupStatusLastUpdatedDate,
		type,
		errorDescription,
	] );
};

export default useBackupNeedsAttentionNotice;
