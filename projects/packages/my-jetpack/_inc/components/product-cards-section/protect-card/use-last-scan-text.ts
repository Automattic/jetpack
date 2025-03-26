import { __, _n, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import useProduct from '../../../data/products/use-product';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import { timeSince } from '../../../utils/time-since';

export const useLastScanText = ( data: ProtectData ) => {
	const slug = 'protect';
	const { detail } = useProduct( slug );
	const { isPluginActive = false } = detail || {};
	const { plugins, themes } = getMyJetpackWindowInitialState();
	const {
		plugins: fromScanPlugins,
		themes: fromScanThemes,
		last_checked: lastScanTime = null,
	} = data?.scanData || {};

	const pluginsCount = fromScanPlugins?.length || Object.keys( plugins ).length;
	const themesCount = fromScanThemes?.length || Object.keys( themes ).length;

	const timeSinceLastScan = lastScanTime ? timeSince( Date.parse( lastScanTime ) ) : false;

	return useMemo( () => {
		if ( isPluginActive ) {
			if ( timeSinceLastScan ) {
				return sprintf(
					/* translators: %s is how long ago since the last scan took place, i.e.- "17 hours ago" */
					__( 'Last scan: %s', 'jetpack-my-jetpack' ),
					timeSinceLastScan
				);
			}
			return null;
		}
		return (
			sprintf(
				/* translators: %d is the number of plugins installed on the site. */
				_n( '%d plugin', '%d plugins', pluginsCount, 'jetpack-my-jetpack' ),
				pluginsCount
			) +
			' ' +
			/* translators: The ampersand symbol here (&) is meaning "and". */
			__( '&', 'jetpack-my-jetpack' ) +
			'\xa0' + // `\xa0` is a non-breaking space.
			sprintf(
				/* translators: %d is the number of themes installed on the site. */
				_n( '%d theme', '%d themes', themesCount, 'jetpack-my-jetpack' ).replace( ' ', '\xa0' ), // `\xa0` is a non-breaking space.
				themesCount
			)
		);
	}, [ isPluginActive, timeSinceLastScan, pluginsCount, themesCount ] );
};
