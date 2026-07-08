/**
 * External dependencies
 */
import { chevronLeft } from '@wordpress/icons';
import { Button, Icon } from '@wordpress/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './widget-back-link.module.scss';

export type WidgetBackLinkProps = {
	/**
	 * Visible label for the parent view.
	 */
	label: string;

	/**
	 * Callback fired when the user navigates back to the parent view.
	 */
	onClick: () => void;

	/**
	 * Optional accessible label. Defaults to `label`.
	 */
	ariaLabel?: string;

	/**
	 * Optional class for widget-specific layout tweaks.
	 */
	className?: string;
};

/**
 * Small back link used by drill-down widget bodies.
 *
 * @param props           - Component props.
 * @param props.label     - Visible parent-view label.
 * @param props.onClick   - Back navigation callback.
 * @param props.ariaLabel - Optional accessible label.
 * @param props.className - Optional additional class name.
 * @return The rendered back link.
 */
export function WidgetBackLink( {
	label,
	onClick,
	ariaLabel = label,
	className,
}: WidgetBackLinkProps ) {
	return (
		<Button
			variant="unstyled"
			onClick={ onClick }
			aria-label={ ariaLabel }
			className={ clsx( styles.backLink, className ) }
		>
			<Icon icon={ chevronLeft } size={ 20 } className={ styles.icon } />
			<span className={ styles.label }>{ label }</span>
		</Button>
	);
}
