/**
 * Connection Initial State
 *
 * @todo it should be provided by the connection package
 */
export interface JPConnectionInitialState {
	apiNonce: string;
	siteSuffix: string;
	connectionStatus: {
		isActive: boolean;
	};
}
