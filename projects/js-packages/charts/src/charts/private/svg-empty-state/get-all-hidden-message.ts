import { _x } from '@wordpress/i18n';

export type HiddenChartItemType = 'series' | 'segments';

/**
 * Return the empty-state message for a chart whose items are all hidden.
 *
 * Each translation call has a distinct gettext context. This prevents Terser
 * from folding conditional calls into one call with a conditional msgid, which
 * would make the strings unavailable to static translation extraction.
 *
 * @param interactive - Whether the legend can be used to show hidden items.
 * @param itemType    - The chart-specific name for its data items.
 * @return The translated empty-state message.
 */
export const getAllHiddenMessage = (
	interactive: boolean,
	itemType: HiddenChartItemType
): string => {
	if ( itemType === 'segments' ) {
		if ( interactive ) {
			return _x(
				'All segments are hidden. Click legend items to show data.',
				'chart empty state: interactive segments',
				'jetpack-charts'
			);
		}

		return _x( 'All segments are hidden.', 'chart empty state: segments', 'jetpack-charts' );
	}

	if ( interactive ) {
		return _x(
			'All series are hidden. Click legend items to show data.',
			'chart empty state: interactive series',
			'jetpack-charts'
		);
	}

	return _x( 'All series are hidden.', 'chart empty state: series', 'jetpack-charts' );
};
