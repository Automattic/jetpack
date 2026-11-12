import { useEffect, useRef } from 'react';
import { recordBoostEvent } from './analytics';
import type { RefObject } from 'react';

export type SettingsGroup = 'cornerstone_pages' | 'page_loading' | 'code_optimization' | 'images';

// Fractional layout and browser zoom can keep a fully visible element's ratio just under 1.
const FULLY_VISIBLE = 0.99;

type SettingsVisit = { active: boolean; seen: Set< string > };
type ExposureOptions = { visit: SettingsVisit } & (
	{ group: SettingsGroup; open: RefObject< boolean > } | { group?: never; open?: never }
);

/**
 * @param active - Whether the Settings route can be seen.
 * @return Shared exposure state for one root-route visit.
 */
export function useSettingsVisit( active = true ): SettingsVisit {
	const seen = useRef( new Set< string >() );
	useEffect( () => {
		if ( ! active ) {
			seen.current.clear();
		}
	}, [ active ] );
	return { active, seen: seen.current };
}

/**
 * @param ref                  - Element whose viewport exposure is measured.
 * @param options              - Exposure target and its visit.
 * @param options.visit        - Shared visit state.
 * @param options.visit.active - Whether the Settings route can be seen.
 * @param options.visit.seen   - Events already sent for this visit.
 * @param options.group        - Stable group slug; omit for the Settings stack.
 * @param options.open         - Current group open state, read when exposure is sent.
 */
export function useSettingsExposure(
	ref: RefObject< HTMLElement >,
	{ visit: { active, seen }, group, open }: ExposureOptions
): void {
	useEffect( () => {
		const element = ref.current;
		if ( ! active || ! element || typeof IntersectionObserver === 'undefined' ) {
			return;
		}

		let observing = true;
		let visible = false;
		let observer: IntersectionObserver;
		const recordExposure = () => {
			const key = group ?? 'settings';
			if ( ! observing || ! visible || document.visibilityState === 'hidden' || seen.has( key ) ) {
				return;
			}

			seen.add( key );
			recordBoostEvent(
				group ? 'settings_group_view' : 'settings_view',
				group ? { group, initial_open: open?.current ? 1 : 0 } : {}
			);
		};
		const observe = () => {
			const height = element.getBoundingClientRect().height;
			const threshold = group
				? FULLY_VISIBLE
				: Math.min( FULLY_VISIBLE, window.innerHeight / 10 / Math.max( height, 1 ) );
			observer?.disconnect();
			visible = false;
			const next = new IntersectionObserver(
				entries => {
					if ( observer !== next ) {
						return;
					}
					visible = entries.some(
						entry => entry.isIntersecting && entry.intersectionRatio >= threshold
					);
					recordExposure();
				},
				{ threshold }
			);
			observer = next;
			observer.observe( element );
		};
		observe();
		const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver( observe );
		resize?.observe( element );
		window.addEventListener( 'resize', observe );
		document.addEventListener( 'visibilitychange', recordExposure );

		return () => {
			observing = false;
			observer.disconnect();
			resize?.disconnect();
			window.removeEventListener( 'resize', observe );
			document.removeEventListener( 'visibilitychange', recordExposure );
		};
	}, [ ref, active, seen, group, open ] );
}
