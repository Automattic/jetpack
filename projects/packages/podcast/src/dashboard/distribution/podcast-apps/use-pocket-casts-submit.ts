import { getSiteData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';

/**
 * Mirrors the response shape documented on
 * `WPCOM_REST_API_V2_Endpoint_Podcast_Distribution::build_response()`.
 *
 * `state` is the discriminator: `active` ships a `share_link`, `pending` is the
 * in-flight intermediate, `rejected` and `unreachable` are terminal failures
 * (`pcc.feedback.errors` carries upstream details on `rejected`).
 */
export type PocketCastsSubmitState = 'active' | 'pending' | 'rejected' | 'unreachable';

export interface PocketCastsFeedbackError {
	field?: string;
	message?: string;
}

export interface PocketCastsPccBody {
	status?: string;
	feedback?: {
		errors?: PocketCastsFeedbackError[];
	};
	share_link?: string;
	[ key: string ]: unknown;
}

export interface PocketCastsSubmitResponse {
	state: PocketCastsSubmitState;
	message: string;
	feed_url: string;
	share_link: string | null;
	pcc: PocketCastsPccBody | null;
}

interface SubmitOptions {
	onSuccess?: ( response: PocketCastsSubmitResponse ) => void;
	onError?: ( error: unknown ) => void;
}

/**
 * POST the Pocket Casts relay. The endpoint is idempotent: re-calling for a
 * known feed returns the current state, so the modal can call this on open to
 * refresh `pending` → `active` without a polling loop.
 *
 * Feed URL is derived server-side from the configured podcasting category, so
 * the caller passes no body.
 *
 * @return `{ submit, isPending, response, error, reset }` — `submit()` resolves to the typed response (or `null` on error / missing blog id); the other fields are local React state so the modal can drive rendering without holding the response itself.
 */
export function usePocketCastsSubmit(): {
	submit: ( options?: SubmitOptions ) => Promise< PocketCastsSubmitResponse | null >;
	isPending: boolean;
	response: PocketCastsSubmitResponse | null;
	error: unknown;
	reset: () => void;
} {
	const [ isPending, setIsPending ] = useState( false );
	const [ response, setResponse ] = useState< PocketCastsSubmitResponse | null >( null );
	const [ error, setError ] = useState< unknown >( null );

	// Guards against late `setState` after unmount when the user closes the
	// modal mid-flight.
	const isMountedRef = useRef( true );
	useEffect( () => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, [] );

	const submit = useCallback( async ( options: SubmitOptions = {} ) => {
		const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
		if ( ! blogId ) {
			const noBlogIdError = new Error( 'Missing wpcom blog id' );
			if ( isMountedRef.current ) {
				setError( noBlogIdError );
			}
			options.onError?.( noBlogIdError );
			return null;
		}

		if ( isMountedRef.current ) {
			setIsPending( true );
			setError( null );
		}
		try {
			const result = ( await apiFetch( {
				path: `/wpcom/v2/sites/${ blogId }/podcast-distribution/pocket-casts/submit`,
				method: 'POST',
			} ) ) as PocketCastsSubmitResponse;

			if ( isMountedRef.current ) {
				setResponse( result );
				setIsPending( false );
			}
			options.onSuccess?.( result );
			return result;
		} catch ( submitError ) {
			if ( isMountedRef.current ) {
				setError( submitError );
				setIsPending( false );
			}
			options.onError?.( submitError );
			return null;
		}
	}, [] );

	const reset = useCallback( () => {
		if ( ! isMountedRef.current ) {
			return;
		}
		setResponse( null );
		setError( null );
		setIsPending( false );
	}, [] );

	return { submit, isPending, response, error, reset };
}
