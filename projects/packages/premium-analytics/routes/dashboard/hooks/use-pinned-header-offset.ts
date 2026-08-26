import { useLayoutEffect } from 'react';
import styles from '../stage.module.scss';

const CUSTOM_PROPERTY = '--pa-pinned-header-block-size';

/**
 * Publishes the pinned page header's height for the section header to rest below.
 *
 * The page scrolls, so both bands pin against the viewport and would otherwise
 * overlap. The height is admin-ui's to decide and changes when the subtitle
 * wraps, so it is measured rather than restated here.
 *
 * @param sectionHeader - The section header element, used to reach the page.
 */
export function usePinnedHeaderOffset( sectionHeader: HTMLElement | null ) {
	useLayoutEffect( () => {
		const page = sectionHeader?.closest< HTMLElement >( `.${ styles.dashboard }` );
		const header = page?.firstElementChild;

		if ( ! page || ! header ) {
			return;
		}

		const observer = new ResizeObserver( () => {
			page.style.setProperty( CUSTOM_PROPERTY, `${ header.getBoundingClientRect().height }px` );
		} );
		observer.observe( header );

		return () => {
			observer.disconnect();
			page.style.removeProperty( CUSTOM_PROPERTY );
		};
	}, [ sectionHeader ] );
}
