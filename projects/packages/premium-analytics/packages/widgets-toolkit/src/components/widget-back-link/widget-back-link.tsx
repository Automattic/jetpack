/**
 * External dependencies
 */
import { Button, Icon } from '@jetpack-premium-analytics/externals';
import { chevronLeft } from '@wordpress/icons';
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

	onClick: () => void;

	/**
	 * Optional accessible label. Defaults to `label`.
	 */
	ariaLabel?: string;

	/**
	 * Optional name of the current view, shown after the link as a breadcrumb.
	 */
	current?: string;

	/**
	 * Optional class for widget-specific layout tweaks, set on the outermost element.
	 */
	className?: string;
};

/**
 * Small back link used by drill-down widget bodies.
 *
 * @return The rendered back link.
 */
export function WidgetBackLink( {
	label,
	onClick,
	ariaLabel = label,
	current,
	className,
}: WidgetBackLinkProps ) {
	const link = (
		<Button
			variant="unstyled"
			onClick={ onClick }
			aria-label={ ariaLabel }
			className={ clsx( styles.backLink, ! current && className ) }
		>
			<Icon icon={ chevronLeft } size={ 20 } className={ styles.icon } />
			<span className={ styles.label }>{ label }</span>
		</Button>
	);

	if ( ! current ) {
		return link;
	}

	return (
		<div className={ clsx( styles.trail, className ) }>
			{ link }
			<span className={ styles.separator } aria-hidden="true">
				/
			</span>
			<span className={ styles.current }>{ current }</span>
		</div>
	);
}
