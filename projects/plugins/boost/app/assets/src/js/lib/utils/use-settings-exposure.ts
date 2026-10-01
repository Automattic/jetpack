import { useEffect, useRef } from 'react';
import { recordBoostEvent } from './analytics';
import type { RefObject } from 'react';

export type SettingsGroup = 'cornerstone_pages' | 'page_loading' | 'code_optimization' | 'images';

export function useSettingsExposure(
	ref: RefObject< HTMLElement >,
	enabled = true,
	visit?: Set< string >,
	group?: SettingsGroup,
	initialOpen = true
): void {
	const seen = useRef( new Set< string >() );
	const events = visit ?? seen.current;

	useEffect( () => {
		const element = ref.current;
		if ( ! enabled || ! element || typeof IntersectionObserver === 'undefined' ) {
			return;
		}

		let active = true;
		let visible = false;
		const recordExposure = () => {
			const key = group ?? 'settings';
			if (
				! active ||
				! visible ||
				document.visibilityState === 'hidden' ||
				element.closest( '[hidden]' ) ||
				events.has( key )
			) {
				return;
			}

			events.add( key );
			recordBoostEvent(
				group ? 'settings_group_view' : 'settings_view',
				group ? { group, initial_open: initialOpen ? 1 : 0 } : {}
			);
		};
		const observer = new IntersectionObserver( entries => {
			visible = entries.some( entry => entry.isIntersecting && entry.intersectionRatio > 0 );
			recordExposure();
		} );
		observer.observe( element );
		document.addEventListener( 'visibilitychange', recordExposure );

		return () => {
			active = false;
			observer.disconnect();
			document.removeEventListener( 'visibilitychange', recordExposure );
		};
	}, [ ref, enabled, events, group, initialOpen ] );
}
