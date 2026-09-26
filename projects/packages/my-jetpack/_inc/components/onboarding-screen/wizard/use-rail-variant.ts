import { useMemo } from 'react';

export type RailVariant = 'list' | 'icons';

const PARAM = 'rail';
const STORE_KEY = 'jetpack-onboarding-rail';

/**
 * Which rail the wizard draws, from `&rail=icons` or `&rail=list` on the URL.
 *
 * Two shapes are being compared: `list`, the Site Editor's sidebar, and `icons`,
 * a narrow column of glyph-over-label the way Slack and ChatGPT build theirs. A
 * query parameter rather than a setting, because this is a question to answer
 * once and then delete along with this file.
 *
 * The choice is kept for the session because the takeover's own redirect builds
 * its URL from a fixed set of arguments and drops everything else, so the
 * parameter does not survive the first page load.
 *
 * @return The rail to draw. Anything unrecognised is the list.
 */
export function useRailVariant(): RailVariant {
	return useMemo( () => {
		if ( typeof window === 'undefined' ) {
			return 'list';
		}

		const asked = new URLSearchParams( window.location.search ).get( PARAM );

		try {
			if ( asked === 'icons' || asked === 'list' ) {
				window.sessionStorage.setItem( STORE_KEY, asked );

				return asked;
			}

			return window.sessionStorage.getItem( STORE_KEY ) === 'icons' ? 'icons' : 'list';
		} catch {
			// Private browsing and blocked site data both throw on access.
			return asked === 'icons' ? 'icons' : 'list';
		}
	}, [] );
}
