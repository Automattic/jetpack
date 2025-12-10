import { Legend } from '../../../components/legend';
import type { ComponentType, FC, PropsWithChildren } from 'react';

/**
 * Base interface for chart subcomponents in the composition API
 */
export interface BaseChartSubComponents {
	Legend: ComponentType< React.ComponentProps< typeof Legend > >;
	SVG: FC< PropsWithChildren >;
	HTML: FC< PropsWithChildren >;
}

/**
 * Type helper for creating chart components with composition API
 * @template TProps - The props type for the chart component
 * @template TSubComponents - Additional subcomponents beyond the base ones
 */
export type ChartComponentWithComposition<
	TProps,
	TSubComponents extends BaseChartSubComponents = BaseChartSubComponents,
> = FC< TProps > & TSubComponents;
