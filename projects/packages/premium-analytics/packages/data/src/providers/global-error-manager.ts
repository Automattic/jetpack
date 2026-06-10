/**
 * External dependencies
 */

export type GlobalErrorType = 'network' | 'auth' | 'server' | null;

type Listener = () => void;

/**
 * Manages global error state outside of React, enabling error state to be set
 * from onlineManager subscription and consumed via useSyncExternalStore.
 */
class GlobalErrorManager {
	private error: GlobalErrorType = null;
	private listeners = new Set< Listener >();

	getError = (): GlobalErrorType => this.error;

	setError = ( error: GlobalErrorType ): void => {
		if ( this.error === error ) {
			return;
		}
		this.error = error;
		this.listeners.forEach( listener => listener() );
	};

	clearError = (): void => this.setError( null );

	subscribe = ( listener: Listener ): ( () => void ) => {
		this.listeners.add( listener );
		return () => this.listeners.delete( listener );
	};
}

export const globalErrorManager = new GlobalErrorManager();
