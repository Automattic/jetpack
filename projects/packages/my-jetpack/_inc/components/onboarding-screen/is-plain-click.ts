import type { MouseEvent } from 'react';

/**
 * Whether a click on a link stays in this tab, rather than opening it somewhere else.
 *
 * @param event - The click.
 * @return True for an unmodified primary-button click.
 */
export function isPlainClick( event: MouseEvent< HTMLElement > ): boolean {
	return (
		event.button === 0 && ! event.metaKey && ! event.ctrlKey && ! event.shiftKey && ! event.altKey
	);
}
