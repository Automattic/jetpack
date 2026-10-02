import type { ProgressBarProps } from './types';
/**
 * A simple horizontal progress bar component.
 *
 * Supports two modes: determinate and indeterminate. A progress bar is determinate
 * when a specific progress value has been specified (from 0 to 100), and indeterminate
 * when a value hasn't been specified.
 *
 * ```jsx
 * import { ProgressBar } from '@wordpress/components';
 *
 * const MyLoadingComponent = () => {
 * 	return <ProgressBar />;
 * };
 * ```
 */
export declare const ProgressBar: import("react").ForwardRefExoticComponent<ProgressBarProps & Omit<Omit<import("react").DetailedHTMLProps<import("react").ProgressHTMLAttributes<HTMLProgressElement>, HTMLProgressElement>, "ref">, "as" | "children" | keyof ProgressBarProps> & import("react").RefAttributes<HTMLProgressElement>>;
export default ProgressBar;
//# sourceMappingURL=index.d.ts.map