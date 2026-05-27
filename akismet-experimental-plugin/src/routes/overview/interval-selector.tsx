/**
 * `<IntervalSelector>` — ToggleGroupControl over the four windows the
 * Overview tab supports (30d / 60d / 6m / all). Controlled component:
 * `OverviewTab` owns the state and drives every card via context.
 */
import {
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- ToggleGroupControl is the canonical Jetpack-monorepo control for a 4-option pill row; precedent at projects/packages/forms/src/blocks/shared/components/jetpack-field-width.js.
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis -- ToggleGroupControlOption follows from ToggleGroupControl; no stable alias exists yet.
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { StatsInterval } from '@/lib/types';

type Props = {
	value: StatsInterval;
	onChange: ( next: StatsInterval ) => void;
};

/**
 * Render the time-range toggle group for the Overview tab.
 *
 * @param props - The component props.
 * @return The rendered selector.
 */
export function IntervalSelector( props: Props ): JSX.Element {
	const { value, onChange } = props;
	return (
		<ToggleGroupControl
			label={ __( 'Time range', 'akismet' ) }
			hideLabelFromVision
			value={ value }
			onChange={ next => onChange( next as StatsInterval ) }
			isBlock
			__nextHasNoMarginBottom
			__next40pxDefaultSize
		>
			<ToggleGroupControlOption value="30-days" label={ __( '30 days', 'akismet' ) } />
			<ToggleGroupControlOption value="60-days" label={ __( '60 days', 'akismet' ) } />
			<ToggleGroupControlOption value="6-months" label={ __( '6 months', 'akismet' ) } />
			<ToggleGroupControlOption value="all" label={ __( 'All time', 'akismet' ) } />
		</ToggleGroupControl>
	);
}
