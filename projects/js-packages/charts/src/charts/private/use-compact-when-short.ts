import { useGlobalChartsTheme } from '../../providers';

/**
 * Whether a `compactWhenShort` chart drops to a sparkline, and the margin it then defaults to.
 *
 * Reads the height the chart was given, not the measured plot area: that grows once the legend
 * is hidden and would flip the chart straight back. A zero height is unmeasured, not short.
 *
 * @param enabled - The chart's `compactWhenShort` prop.
 * @param height  - The height the chart was given.
 * @return Whether the chart is compact, and the sparkline margin when it is.
 */
export const useCompactWhenShort = ( enabled: boolean, height: number | undefined ) => {
	const { sparkline } = useGlobalChartsTheme();
	const isCompact = enabled && ( height ?? 0 ) > 0 && height < sparkline.compactBelow;

	return { isCompact, compactMargin: isCompact ? sparkline.margin : undefined };
};
