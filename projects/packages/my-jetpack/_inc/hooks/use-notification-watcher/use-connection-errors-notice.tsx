import { Col, Text } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, useRestoreConnection } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';
import type { NoticeOptions } from '../../context/notices/types';

const useConnectionErrorsNotice = () => {
	const { setNotice, resetNotice } = useContext( NoticeContext );
	const { hasConnectionError, connectionErrorMessage } = useConnectionErrorNotice();
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();
	const { recordEvent } = useAnalytics();

	useEffect( () => {
		// Reset notice before showing the failed to restore connection notice
		resetNotice();
	}, [ resetNotice, restoreConnectionError ] );

	useEffect( () => {
		if ( ! hasConnectionError ) {
			return;
		}

		let errorMessage = connectionErrorMessage;

		if ( restoreConnectionError ) {
			errorMessage = (
				<Col>
					<Text mb={ 2 }>
						{ sprintf(
							/* translators: placeholder is the error. */
							__( 'There was an error reconnecting Jetpack. Error: %s', 'jetpack-my-jetpack' ),
							restoreConnectionError
						) }
					</Text>
					<Text mb={ 2 }>{ connectionErrorMessage }</Text>
				</Col>
			);
		}

		const onCtaClick = () => {
			restoreConnection();
			recordEvent( 'jetpack_my_jetpack_connection_error_notice_reconnect_cta_click' );
		};

		const loadingButtonLabel = __( 'Reconnecting Jetpack…', 'jetpack-my-jetpack' );
		const restoreButtonLabel = __( 'Restore Connection', 'jetpack-my-jetpack' );

		const noticeOptions: NoticeOptions = {
			id: 'connection-error-notice',
			level: 'error',
			actions: [
				{
					label: restoreButtonLabel,
					onClick: onCtaClick,
					isLoading: isRestoringConnection,
					loadingText: loadingButtonLabel,
					noDefaultClasses: true,
				},
			],
			priority: NOTICE_PRIORITY_HIGH + ( isRestoringConnection ? 1 : 0 ),
		};

		setNotice( {
			message: errorMessage,
			options: noticeOptions,
		} );
	}, [
		setNotice,
		recordEvent,
		hasConnectionError,
		connectionErrorMessage,
		restoreConnection,
		isRestoringConnection,
		restoreConnectionError,
		resetNotice,
	] );
};

export default useConnectionErrorsNotice;
