import { SelectControl } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { PodcastStatsPeriod } from '../types';

const PERIOD_OPTIONS: PodcastStatsPeriod[] = [ '7d', '30d', '90d', 'all' ];

// Episode endpoint has no all-time variant — show "Last year" in that scope.
export type PeriodScope = 'show' | 'episode';

/**
 * Type guard for `PodcastStatsPeriod`.
 *
 * @param value - Candidate string.
 * @return      Whether the value is a recognized period.
 */
export function isPeriod( value: string ): value is PodcastStatsPeriod {
	return ( PERIOD_OPTIONS as readonly string[] ).includes( value );
}

/**
 * Translated heading for a period.
 *
 * @param value - Period.
 * @param scope - Show or episode scope.
 * @return      Heading.
 */
export function getPeriodHeading( value: PodcastStatsPeriod, scope: PeriodScope = 'show' ): string {
	if ( value === '7d' ) {
		return __( 'Last 7 days', 'jetpack-podcast' );
	}
	if ( value === '30d' ) {
		return __( 'Last 30 days', 'jetpack-podcast' );
	}
	if ( value === '90d' ) {
		return __( 'Last 90 days', 'jetpack-podcast' );
	}
	if ( scope === 'episode' ) {
		return __( 'Last year', 'jetpack-podcast' );
	}
	return __( 'All time', 'jetpack-podcast' );
}

type PeriodControlProps = {
	value: PodcastStatsPeriod;
	onChange: ( next: PodcastStatsPeriod ) => void;
	scope?: PeriodScope;
};

const PeriodControl = ( { value, onChange, scope = 'show' }: PeriodControlProps ) => {
	const options = useMemo(
		() =>
			PERIOD_OPTIONS.map( option => ( {
				value: option,
				label: getPeriodHeading( option, scope ),
			} ) ),
		[ scope ]
	);
	const handleChange = useCallback(
		( next: string ) => {
			if ( isPeriod( next ) ) {
				onChange( next );
			}
		},
		[ onChange ]
	);
	return (
		<SelectControl
			__nextHasNoMarginBottom
			__next40pxDefaultSize
			label={ __( 'Period', 'jetpack-podcast' ) }
			value={ value }
			options={ options }
			onChange={ handleChange }
		/>
	);
};

export default PeriodControl;
