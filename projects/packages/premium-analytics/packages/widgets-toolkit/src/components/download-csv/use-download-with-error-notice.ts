/**
 * External dependencies
 */
import { useRegistry } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

function getErrorMessage( error: unknown ): string {
	if ( error instanceof Error && error.message ) {
		return error.message;
	}
	if (
		typeof error === 'object' &&
		error !== null &&
		'message' in error &&
		typeof error.message === 'string' &&
		error.message
	) {
		return error.message;
	}

	return __( 'Could not download report.', 'jetpack-premium-analytics-pkg' );
}

/** Wrap a download so a failure shows a dismissible snackbar instead of rejecting. */
export function useDownloadWithErrorNotice(
	download: () => Promise< unknown > | void
): () => Promise< void > {
	const registry = useRegistry();

	return async () => {
		try {
			await download();
		} catch ( error ) {
			registry.dispatch( 'core/notices' ).createErrorNotice( getErrorMessage( error ), {
				type: 'snackbar',
				explicitDismiss: true,
			} );
		}
	};
}
