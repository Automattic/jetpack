/**
 * WordPress dependencies
 */
import * as editor from '@wordpress/editor';

// Trying to unlock the private APIs may fail in production builds.
const unlockEditor = ( editor as unknown as { unlock?: ( obj: unknown ) => any } ).unlock;
const privateApis = ( editor as unknown as { privateApis?: unknown } ).privateApis;

export type InterfaceStore = {
	enableComplementaryArea?: ( scope: string, area: string ) => void;
	getActiveComplementaryArea?: ( scope: string ) => string | null;
};

const fallbackStore: InterfaceStore = {
	enableComplementaryArea: () => {},
	getActiveComplementaryArea: () => null,
};

const unlockedStore = unlockEditor && privateApis ? unlockEditor( privateApis ) : null;

const interfaceStore = ( unlockedStore || fallbackStore ) as InterfaceStore;

export default interfaceStore;
