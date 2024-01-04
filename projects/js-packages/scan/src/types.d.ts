import { JPConnectionInitialState } from './types';

declare global {
	interface Window {
		JP_CONNECTION_INITIAL_STATE: JPConnectionInitialState;
	}
}
