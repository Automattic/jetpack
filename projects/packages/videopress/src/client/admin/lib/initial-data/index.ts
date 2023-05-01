/**
 * Types
 */
import type { JetpackVideoPressInitialState } from '../../components/admin-page/types';

// Copy to avoid mutation
export const initialData: JetpackVideoPressInitialState = structuredClone(
	window?.jetpackVideoPressInitialState ?? {}
);
