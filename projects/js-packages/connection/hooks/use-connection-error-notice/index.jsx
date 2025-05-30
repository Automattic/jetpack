import ConnectionErrorNotice from '../../components/connection-error-notice';
import useConnection from '../../components/use-connection';
import useRestoreConnection from '../../hooks/use-restore-connection/index.jsx';

/**
 * Connection error notice hook.
 * Returns a ConnectionErrorNotice component and the conditional flag on whether
 * to render the component or not.
 *
 * @return {object} - The hook data.
 */
export default function useConnectionErrorNotice() {
	const { connectionErrors } = useConnection( {} );
	const connectionErrorList = Object.values( connectionErrors ).shift();
	const firstError =
		connectionErrorList &&
		Object.values( connectionErrorList ).length &&
		Object.values( connectionErrorList ).shift();

	const connectionErrorMessage = firstError && firstError.error_message;

	// Hide error notice for protected owner errors
	const isProtectedOwnerError = firstError && firstError.error_type === 'protected_owner';
	const hasConnectionError = Boolean( connectionErrorMessage ) && ! isProtectedOwnerError;

	return { hasConnectionError, connectionErrorMessage };
}

export const ConnectionError = () => {
	const { hasConnectionError, connectionErrorMessage } = useConnectionErrorNotice();
	const { restoreConnection, isRestoringConnection, restoreConnectionError } =
		useRestoreConnection();

	return hasConnectionError ? (
		<ConnectionErrorNotice
			isRestoringConnection={ isRestoringConnection }
			restoreConnectionError={ restoreConnectionError }
			restoreConnectionCallback={ restoreConnection }
			message={ connectionErrorMessage }
		/>
	) : null;
};
