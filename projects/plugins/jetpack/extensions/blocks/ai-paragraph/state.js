// Added state because with the way gutenberg works, replacing the inner blocks
// doesn't mark the block as dirty, we need to update an attribute after the
// inner blocks have been replaced.  This makes the preview button work after
// the block is rendered.
export const STATE = Object.freeze( {
	DEFAULT: '',
	PROCESSING: 'processing',
	RENDERING: 'rendering',
	DONE: 'done',
	ERROR: 'error',
	RETRY: 'retry',
} );

export const ERROR_STATES = [ STATE.ERROR, STATE.RETRY ];
export const WAITING_STATES = [ STATE.PROCESSING ];
export const TRIGGERED_STATES = [ STATE.PROCESSING, STATE.RENDERING, STATE.DONE ];
export const UNTRIGGERED_STATES = [ STATE.DEFAULT, STATE.ERROR, STATE.RETRY ];
export const DONE_LOADING_STATES = [ STATE.RENDERING, STATE.DONE ];
export const READY_TO_RETRY_STATES = [ STATE.RETRY ];

export function deriveStates( state ) {
	return {
		isError: ERROR_STATES.includes( state ),
		isTriggered: TRIGGERED_STATES.includes( state ),
		isUntriggered: UNTRIGGERED_STATES.includes( state ),
		isDoneLoading: DONE_LOADING_STATES.includes( state ),
		isWaitingForAI: WAITING_STATES.includes( state ),
		isReadyToRetry: READY_TO_RETRY_STATES.includes( state ),
	};
}
