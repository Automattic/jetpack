import { withResponsive } from '../private/with-responsive';
import { SparklineUnresponsive } from './sparkline';
import type { SparklineProps } from './types';
import type { Optional } from '../../types';
import type { ResponsiveConfig } from '../private/with-responsive';

/**
 * Responsive Sparkline chart component
 */
export const Sparkline = withResponsive< SparklineProps >( SparklineUnresponsive );

export { SparklineUnresponsive };
export type { SparklineProps, Optional, ResponsiveConfig };
export type { GradientConfig, SparklineDataPoint } from './types';
