import { screen } from '@testing-library/react';
import { createReduxStore, createRegistry } from '@wordpress/data';

/**
 * Find a `Notice` message in the a11y-speak live region it was announced to:
 * `@wordpress/ui` speaks `error` assertively and every other intent politely.
 *
 * @param text       - The announced message.
 * @param politeness - The live region it should land in.
 * @return The live region.
 */
export function getNoticeAnnouncement(
	text: string,
	politeness: 'polite' | 'assertive'
): HTMLElement {
	return screen.getByText( text, { selector: `#a11y-speak-${ politeness }` } );
}

/**
 * Find a `Notice` message on screen, apart from its live-region copy.
 *
 * @param text - The message.
 * @return The message element.
 */
export function getNoticeText( text: string ): HTMLElement {
	return screen.getByText( text, { ignore: '.a11y-speak-region, script, style' } );
}

/**
 * Build a registry whose `core/notices` store records error and success notice calls.
 *
 * `@wordpress/notices` is not a dependency of this package; wp-admin registers it in production.
 *
 * @return The registry, and the action creators to assert on.
 */
export function createNoticesRegistry() {
	const createErrorNotice = jest.fn( () => ( { type: 'CREATE_ERROR_NOTICE' } ) );
	const createSuccessNotice = jest.fn( () => ( { type: 'CREATE_SUCCESS_NOTICE' } ) );
	const registry = createRegistry();
	registry.register(
		createReduxStore( 'core/notices', {
			reducer: ( state = null ) => state,
			actions: { createErrorNotice, createSuccessNotice },
		} )
	);

	return { registry, createErrorNotice, createSuccessNotice };
}
