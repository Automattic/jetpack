import { ConnectionErrorNotice, useConnection } from '@automattic/jetpack-connection';

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
		connectionErrorList && connectionErrorList.length && connectionErrorList[ 0 ].error_message;

	const hasConnectionError = Boolean( connectionErrorMessage );

	return { hasConnectionError, connectionErrorMessage };
}

export const ConnectionError = () => {
	const { hasConnectionError, connectionErrorMessage } = useConnectionErrorNotice();

	return hasConnectionError ? <ConnectionErrorNotice message={ connectionErrorMessage } /> : null;
};
