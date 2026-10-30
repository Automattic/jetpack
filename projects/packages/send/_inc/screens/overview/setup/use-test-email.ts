import { speak } from '@wordpress/a11y';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { errorMessage, fetchStatus, sendTest } from '../../../data/api';
import { failureMessage, failureReason, isUnsure } from '../../../data/failure-reasons';
import { sendStore } from '../../../data/store';
import type { FailureReason } from '../../../data/failure-reasons';
import type { SendStatus, TestResult } from '../../../data/types';

/**
 * The title for a test that didn't go out through Send. When Send can't tell, it doesn't say the
 * test failed, because the reason says it may still arrive.
 *
 * @param kind - Why it failed.
 * @return The title, with no full stop.
 */
export function testFailedTitle( kind: FailureReason ): string {
	return isUnsure( kind )
		? __( 'Jetpack Send isn’t sure your test went out', 'jetpack-send-pkg' )
		: __( 'Your test didn’t go out', 'jetpack-send-pkg' );
}

export type TestEmailState =
	| { phase: 'idle' }
	| { phase: 'sending' }
	| { phase: 'sent'; logId: string }
	| { phase: 'failed'; logId: string; reason: string; kind: FailureReason }
	| { phase: 'refused'; code: string; message: string };

/**
 * Where the current user's test goes. The server decides; this mirrors it for display.
 *
 * @param status - Send status.
 * @return The address.
 */
export function testRecipient( status: SendStatus ): string {
	return status.current_user_email || status.onboarding.test_to || status.admin_email;
}

/**
 * The REST error code from an apiFetch rejection.
 *
 * @param error - The rejection.
 * @return The code, or ''.
 */
function errorCode( error: unknown ): string {
	return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string'
		? error.code
		: '';
}

/**
 * What a refused test says: the rate-limit or not-ready sentence, else the server's message.
 *
 * @param code    - REST error code.
 * @param message - The server's message.
 * @param domain  - The sending domain.
 * @return The sentence.
 */
export function refusalText( code: string, message: string, domain: string ): string {
	if ( code === 'jetpack_send_rate_limited' ) {
		return __( 'You’ve sent a few tests already. Try again in a few minutes.', 'jetpack-send-pkg' );
	}
	if ( code === 'jetpack_send_not_ready' ) {
		/* translators: %s: the sending domain. */
		return sprintf( __( 'Finish connecting %s first.', 'jetpack-send-pkg' ), domain );
	}
	return message;
}

/**
 * One plain sentence for why a test failed: the server's stored reason when it sent one, else a
 * reading of the error text.
 *
 * @param result  - The test's result.
 * @param domain  - The sending domain.
 * @param devMode - Accounts come from the local development provisioner.
 * @return The sentence.
 */
export function testFailureText(
	result: Pick< TestResult, 'error' | 'reason' >,
	domain: string,
	devMode = false
): string {
	return failureMessage( failureReason( result ), domain, { devMode, isTest: true } );
}

/**
 * Send a test to the current user and keep its result. Only one runs at a time.
 * After a test the store's status is read again, so a route mounted later sees the test.
 *
 * @param domain  - The sending domain, for the plain failure reason.
 * @param devMode - Accounts come from the local development provisioner.
 * @return The state and the send callback.
 */
export function useTestEmail( domain: string, devMode = false ) {
	const [ state, setState ] = useState< TestEmailState >( { phase: 'idle' } );
	const busy = useRef( false );
	const mounted = useRef( true );
	const { receiveStatus, logChanged } = useDispatch( sendStore );
	useEffect(
		() => () => {
			mounted.current = false;
		},
		[]
	);

	const send = useCallback( async () => {
		if ( busy.current ) {
			return;
		}
		busy.current = true;
		setState( { phase: 'sending' } );
		try {
			const result = await sendTest();
			// The test is in the log now, sent or not; lists and stats on screen load it.
			logChanged();
			// The server stamped the test; keep the store in step. The store outlives this page.
			fetchStatus()
				.then( receiveStatus )
				.catch( () => undefined );
			if ( ! mounted.current ) {
				return;
			}
			if ( result.success ) {
				setState( { phase: 'sent', logId: result.log_id ?? '' } );
				speak( __( 'Your test is on its way.', 'jetpack-send-pkg' ) );
			} else {
				const reason = testFailureText( result, domain, devMode );
				const kind = failureReason( result );
				setState( { phase: 'failed', logId: result.log_id ?? '', reason, kind } );
				speak( `${ testFailedTitle( kind ) }. ${ reason }`, 'assertive' );
			}
		} catch ( error ) {
			if ( ! mounted.current ) {
				return;
			}
			const code = errorCode( error );
			const message = errorMessage( error );
			setState( { phase: 'refused', code, message } );
			speak( refusalText( code, message, domain ), 'assertive' );
		} finally {
			busy.current = false;
		}
	}, [ domain, devMode, receiveStatus, logChanged ] );

	// Clears a shown result, e.g. when its notice is closed.
	const reset = useCallback( () => setState( { phase: 'idle' } ), [] );

	return { state, send, reset };
}

export type TestEmail = ReturnType< typeof useTestEmail >;
