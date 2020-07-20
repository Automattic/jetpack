/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { SVG, Icon, Circle } from '@wordpress/components';

const paidIconIndicator = ( { cx = 21, cy = 3, r = 4, fill = '#e34c84' } ) => {
	return (
		<SVG>
			<Circle cx={ cx } cy={ cy } r={ r } fill="#fff" />
			<Circle cx={ cx } cy={ cy } r={ r - 1 } fill={ fill } />
		</SVG>
	);
};
export const PremiumIcon = ( { icon } ) => {
	return (
		<SVG>
			<Icon icon={ icon && icon.src ? icon.src : icon } />
			<Icon icon={ paidIconIndicator } />
		</SVG>
	);
};
