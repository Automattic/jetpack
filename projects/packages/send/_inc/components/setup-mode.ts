import { createContext, useContext } from '@wordpress/element';
import type { SetupMode } from '../screens/overview/setup/model';

export type SetupModeValue = {
	mode: SetupMode;
	/** Finish setup: show the Overview for a site that's sending. */
	finish: () => void;
};

/** Decided once per page by StatusGate, so the page width and the Overview agree. */
export const SetupModeContext = createContext< SetupModeValue | null >( null );

/**
 * The page's setup mode, or null outside StatusGate.
 *
 * @return The mode and the finish callback.
 */
export function useSetupModeContext(): SetupModeValue | null {
	return useContext( SetupModeContext );
}
