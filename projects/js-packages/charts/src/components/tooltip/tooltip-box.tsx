import clsx from 'clsx';
import { forwardRef } from 'react';
import { TOOLTIP_SCOPE_CLASS } from '../../styles/chart-scope-class';
import styles from './base-tooltip.module.scss';
import { TooltipTheme } from './private/tooltip-theme';
import type { HTMLAttributes } from 'react';

type TooltipBoxProps = HTMLAttributes< HTMLDivElement > & {
	/** Drop the chart surface, scope class and dark theme, leaving a bare box. */
	unstyled?: boolean;
};

/**
 * The chart tooltip box: the dark surface every chart tooltip draws. It does not position itself; place it with `style` or a wrapper.
 *
 * @param props          - Div attributes, plus `unstyled`.
 * @param props.unstyled - Drop the surface, scope class and theme.
 * @param ref            - Forwarded to the box element.
 * @return The tooltip box.
 */
export const TooltipBox = forwardRef< HTMLDivElement, TooltipBoxProps >(
	( { unstyled = false, role = 'tooltip', className, children, ...rest }, ref ) => {
		const box = (
			<div
				ref={ ref }
				role={ role }
				className={ clsx(
					'visx-tooltip',
					! unstyled && [ TOOLTIP_SCOPE_CLASS, styles.surface ],
					className
				) }
				{ ...rest }
			>
				{ children }
			</div>
		);
		return unstyled ? box : <TooltipTheme>{ box }</TooltipTheme>;
	}
);

TooltipBox.displayName = 'TooltipBox';

export type { TooltipBoxProps };
