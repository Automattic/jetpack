/**
 * Internal dependencies
 */
import Controls from './controls';
import { store } from './store'; // Register the store
/**
 * Types
 */
import { BreveControls } from './types';

const Breve = Controls as BreveControls;

export { Breve };
export { default as Highlight, registerBreveHighlights } from './highlight';
export { store };
