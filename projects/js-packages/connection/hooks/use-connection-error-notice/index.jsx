import ConnectionErrorNotice from '../../components/connection-error-notice';
import useConnection from '../../components/use-connection';
import useRestoreConnection from '../../hooks/use-restore-connection/index.jsx';

/**
 * Connection error notice hook.
 * Returns a ConnectionErrorNotice component and the conditional flag on whether
 * to render the component or not.
 *
 * @returns {Object} - The hook data.
 */
export default function useConnectionErrorNotice() {
	const { connectionErrors } = useConnection( {} );
	const connectionErrorList = Object.values( connectionErrors ).shift();
	const connectionErrorMessage =
		connectionErrorList &&
		Object.values( connectionErrorList ).length &&
		Object.values( connectionErrorList ).shift().error_message;

	const hasConnectionError = Boolean( connectionErrorMessage );

	return { hasConnectionError, connectionErrorMessage };
}

export const ConnectionError = () => {
	const { hasConnectionError, connectionErrorMessage } = useConnectionErrorNotice();
	const {
		restoreConnection,
		isRestoringConnection,
		restoreConnectionError,
	} = useRestoreConnection();

	return hasConnectionError ? (
		<ConnectionErrorNotice
			isRestoringConnection={ isRestoringConnection }
			restoreConnectionError={ restoreConnectionError }
			restoreConnectionCallback={ restoreConnection }
			message={ connectionErrorMessage }
		/>
	) : null;
};
