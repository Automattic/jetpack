import { RenderCount } from '../types';
import { INCREMENT_RENDER_COUNT } from './constants';

/**
 * Increments the render count for a given element by key.
 *
 * @param {keyof RenderCount} key - Key of the render count to increment.
 *
 * @return An action object.
 */
export function incrementRenderCountFor( key: keyof RenderCount ) {
	return {
		type: INCREMENT_RENDER_COUNT,
		key,
	};
}
