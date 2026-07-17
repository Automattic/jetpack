import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import Text from '../text/index.tsx';
import styles from './style.module.scss';
import type { JSX } from 'react';

export interface StatusProps {
	status?: 'active' | 'error' | 'inactive' | 'action' | 'initializing';
	label?: string;
	className?: string;
}

/**
 * Status component.
 *
 * @deprecated Inline the equivalent JSX using `Text` from `@wordpress/ui` and a small color-coded indicator span. The wrapper renders a flex container at `body-sm` size with `font-weight: 600` and a `0.666em` round indicator coloured by status using WPDS design tokens (`var(--wpds-color-foreground-content-success-weak)` for `active`, `--wpds-color-foreground-content-error-weak` for `error`, `--wpds-color-foreground-content-neutral-weak` for `inactive`, `--wpds-color-foreground-content-warning-weak` for `action`, `--wpds-color-foreground-content-info-weak` for `initializing`). Include a fallback hex for surfaces that don't load `@wordpress/theme/design-tokens.css` (e.g. the legacy Jetpack settings dashboard).
 *
 * @param {StatusProps} props           - The component properties.
 * @param {string}      props.className - Optional className forwarded to the outer element.
 * @param {string}      props.label     - Status label. Defaults to a status-derived string.
 * @param {string}      props.status    - Status key: `active | error | inactive | action | initializing`.
 * @return {JSX.Element} The `Status` component.
 */
const Status = ( { className, label, status = 'inactive' }: StatusProps ): JSX.Element => {
	const defaultLabels: Record< string, string > = {
		active: __( 'Active', 'jetpack-components' ),
		error: __( 'Error', 'jetpack-components' ),
		action: __( 'Action needed', 'jetpack-components' ),
		inactive: __( 'Inactive', 'jetpack-components' ),
		initializing: __( 'Setting up', 'jetpack-components' ),
	};

	return (
		<Text
			variant="body-extra-small"
			className={ clsx(
				styles.status,
				{
					[ styles[ `is-${ status }` ] ]: status,
				},
				className
			) }
		>
			<span className={ styles.status__indicator } />
			<span className={ styles.status__label }>
				{ label || label === '' ? label : defaultLabels[ status ] }
			</span>
		</Text>
	);
};

export default Status;
