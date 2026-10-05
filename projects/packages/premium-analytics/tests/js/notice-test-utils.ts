import { screen } from '@testing-library/react';

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
