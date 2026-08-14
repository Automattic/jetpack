import { Stack } from '@wordpress/ui';
import clsx from 'clsx';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import styles from './center.module.scss';

export type CenterProps = ComponentPropsWithoutRef< typeof Stack >;

/**
 * Centers its children on both axes and fills its parent.
 *
 * A thin wrapper around `Stack` with `align="center"` and `justify="center"`
 * defaults (both overridable) plus `width: 100%; height: 100%`. Reads more
 * honestly than a `Stack` with both axes centered, and lets call sites drop
 * ad-hoc `*__centering` classes. Forwards its ref and spreads remaining props
 * onto the underlying `Stack`.
 *
 * @param props - Stack props; `align`/`justify` default to `"center"`.
 * @param ref   - Forwarded to the underlying element.
 * @return The centered layout element.
 */
export const Center = forwardRef< HTMLDivElement, CenterProps >(
	( { align = 'center', justify = 'center', className, ...props }, ref ) => (
		<Stack
			ref={ ref }
			align={ align }
			justify={ justify }
			className={ clsx( styles.center, className ) }
			{ ...props }
		/>
	)
);

Center.displayName = 'Center';
