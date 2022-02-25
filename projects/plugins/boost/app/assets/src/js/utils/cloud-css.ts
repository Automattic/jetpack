/**
 * Internal dependencies
 */
import api from '../api/api';
import { updateStatus, resetStatus, CloudCssStatus } from '../stores/cloud-css-status';

export async function requestCloudCss(): Promise< void > {
	// Todo: Debounce request.
	resetStatus();
	await api.post( '/cloud-css/request-generate' );
	pollStatus();
}

function pollStatus(): void {
	const statusIntervalId = setInterval( async () => {
		const status = await api.get< CloudCssStatus >( '/cloud-css/status' );
		updateStatus( status );
		if ( ! status.pending ) {
			clearInterval( statusIntervalId );
		}
	}, 5000 );
}
