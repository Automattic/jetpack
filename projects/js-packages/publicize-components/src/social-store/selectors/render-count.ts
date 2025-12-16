import { RenderCount, SocialStoreState } from '../types';

/**
 * Gets the render count for a given element by key.
 *
 * @param {SocialStoreState}  state - State object.
 * @param {keyof RenderCount} key   - Key of the render count to retrieve.
 *
 * @return The render count for the specified key.
 */
export function getRenderCountFor( state: SocialStoreState, key: keyof RenderCount ) {
	return state.renderCount?.[ key ] ?? 0;
}
