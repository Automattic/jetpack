import { useCallback, useEffect, useRef, useState } from 'react';

type UsePollingParams = {
	/** The async callback to run on each poll. */
	callback?: () => Promise< unknown >;
	/** Handler function for the polling callback's response. Return false to stop polling. */
	handleCallbackResponse?: ( value: unknown ) => boolean;
	/** Handler function for polling callback errors. Return false to stop polling. */
	handleCallbackError?: ( error: unknown ) => boolean;
	/** Interval in milliseconds. */
	interval?: number;
};

type UsePollingReturn = {
	/** Start polling. */
	start: () => void;
	/** Stop polling. */
	stop: () => void;
	/** Whether the poll is currently running. */
	isPolling: boolean;
};

/**
 * Polling Hook
 *
 * Continuously execute a callback at a specified interval.
 *
 * @param {UsePollingParams} params - The polling effect parameters.
 *
 * @returns {UsePollingReturn} - The polling effect return values.
 */
const usePolling = ( {
	callback = () => Promise.resolve(),
	handleCallbackResponse = () => true,
	handleCallbackError = () => false,
	interval = 5_000,
}: UsePollingParams = {} ): UsePollingReturn => {
	// Track polling state across renders with refs.
	const isPollingRef = useRef( false );
	const timeoutIdRef = useRef< ReturnType< typeof setTimeout > >();
	const isMountedRef = useRef( true );

	// Additionaly track polling status in state.
	const [ isPolling, setIsPolling ] = useState( isPollingRef.current );

	const start = () => {
		clearTimeout( timeoutIdRef.current );
		isPollingRef.current = true;
		setIsPolling( true );
		pollingCallback();
	};

	const stop = () => {
		clearTimeout( timeoutIdRef.current );
		isPollingRef.current = false;
		setIsPolling( false );
	};

	const pollingCallback = useCallback( async () => {
		if ( ! isPollingRef.current || ! isMountedRef.current ) {
			return;
		}

		try {
			const callbackResult = await Promise.resolve().then( callback );
			if ( handleCallbackResponse( callbackResult ) === false ) {
				stop();
			}
		} catch ( callbackError ) {
			if ( handleCallbackError( callbackError ) === false ) {
				stop();
			}
		} finally {
			if ( isPollingRef.current && isMountedRef.current ) {
				timeoutIdRef.current = setTimeout( pollingCallback, interval );
			}
		}
	}, [ callback, handleCallbackError, handleCallbackResponse, interval ] );

	useEffect( () => {
		isMountedRef.current = true;

		return () => {
			clearTimeout( timeoutIdRef.current );
			isMountedRef.current = false;
			isPollingRef.current = false;
		};
	}, [] );

	return {
		start,
		stop,
		isPolling,
	};
};

export default usePolling;
