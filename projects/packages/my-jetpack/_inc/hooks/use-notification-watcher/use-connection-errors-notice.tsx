import { Col, Text } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, useRestoreConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import { NOTICE_PRIORITY_HIGH } from '../../context/constants';
import { NoticeContext } from '../../context/notices/noticeContext';
import useAnalytics from '../use-analytics';

const useConnectionErrorsNotice = () => {
	const { setNotice, resetNotice } = useContext( NoticeContext );
	const { hasConnectionError, connectionErrorMessage } = useConnectionErrorNotice();
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();
	const { recordEvent } = useAnalytics();

	useEffect( () => {
		// Reset notice when the status of reconnection changes
		resetNotice();
	}, [ resetNotice, connectionErrorMessage, isRestoringConnection ] );

	useEffect( () => {
		if ( ! hasConnectionError ) {
			return;
		}

		let errorMessage = connectionErrorMessage;

		if ( restoreConnectionError ) {
			errorMessage = (
				<Col>
					<Text mb={ 2 }>{ restoreConnectionError }</Text>
					<Text mb={ 2 }>{ connectionErrorMessage }</Text>
				</Col>
			);
		}

		const onCtaClick = () => {
			restoreConnection();
			recordEvent( 'jetpack_my_jetpack_connection_error_notice_cta_click' );
		};

		const loadingButtonLabel = __( 'Reconnecting Jetpack', 'jetpack-my-jetpack' );
		const restoreButtonLabel = __( 'Restore Connection', 'jetpack-my-jetpack' );

		const noticeOptions = {
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
			priority: NOTICE_PRIORITY_HIGH,
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
	] );
};

export default useConnectionErrorsNotice;
