import apiFetch from '@wordpress/api-fetch';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { refreshPodcastSettings } from '../../../hooks/use-podcast-settings';

// Stable shape from
// wpcom: wp-content/rest-api-plugins/endpoints/podcast-distribution.php.
// `state` is the discriminator the UI switches on regardless of HTTP code.
export interface PocketCastsSubmitResponse {
	state: 'active' | 'pending' | 'rejected' | 'unreachable';
	message: string;
	feed_url: string;
	share_link: string | null;
	// Raw decoded Pocket Casts body (or null). We mine `feedback.errors` for
	// rejection reasons; everything else stays opaque.
	pcc: unknown;
}

export interface SubmitState {
	isSubmitting: boolean;
	result: PocketCastsSubmitResponse | null;
	errorMessage: string | null;
}

/**
 * Pull human-readable rejection reasons out of the raw Pocket Casts body.
 * Their `feedback.errors` is an array of strings or `{ message }` objects in
 * the wild; both forms are accepted, anything else is dropped.
 *
 * @param pcc - Raw decoded Pocket Casts body from the relay response.
 * @return List of trimmed reason strings (empty if none found).
 */
export function extractRejectionReasons( pcc: unknown ): string[] {
	if ( ! pcc || typeof pcc !== 'object' ) {
		return [];
	}
	const feedback = ( pcc as Record< string, unknown > ).feedback;
	if ( ! feedback || typeof feedback !== 'object' ) {
		return [];
	}
	const errors = ( feedback as Record< string, unknown > ).errors;
	if ( ! Array.isArray( errors ) ) {
		return [];
	}
	const out: string[] = [];
	for ( const entry of errors ) {
		if ( typeof entry === 'string' && entry.trim() !== '' ) {
			out.push( entry.trim() );
		} else if ( entry && typeof entry === 'object' ) {
			const msg = ( entry as Record< string, unknown > ).message;
			if ( typeof msg === 'string' && msg.trim() !== '' ) {
				out.push( msg.trim() );
			}
		}
	}
	return out;
}

/**
 * State + dispatcher for the Pocket Casts feed submission.
 *
 * Calls the wpcom relay; the relay persists `podcasting_show_states.pocketcasts`
 * on the server for pending/active/rejected, so we refresh the shared settings
 * cache on those responses to keep the SPA in sync.
 *
 * @return `{ submit, isSubmitting, result, errorMessage }` — `result.state`
 * is the discriminator the UI switches on.
 */
export function usePocketCastsSubmit(): SubmitState & { submit: () => void } {
	const [ isSubmitting, setIsSubmitting ] = useState( false );
	const [ result, setResult ] = useState< PocketCastsSubmitResponse | null >( null );
	const [ errorMessage, setErrorMessage ] = useState< string | null >( null );

	const submit = useCallback( () => {
		setIsSubmitting( true );
		setErrorMessage( null );
		apiFetch< PocketCastsSubmitResponse >( {
			path: '/wpcom/v2/podcast-distribution/pocket-casts/submit',
			method: 'POST',
		} )
			.then( response => {
				setResult( response );
				if ( response.state === 'unreachable' ) {
					setErrorMessage(
						response.message ||
							__( 'We couldn’t reach Pocket Casts right now. Please try again.', 'jetpack-podcast' )
					);
				} else {
					refreshPodcastSettings();
				}
			} )
			.catch( () => {
				setErrorMessage(
					__( 'We couldn’t reach Pocket Casts right now. Please try again.', 'jetpack-podcast' )
				);
			} )
			.finally( () => {
				setIsSubmitting( false );
			} );
	}, [] );

	return { submit, isSubmitting, result, errorMessage };
}
