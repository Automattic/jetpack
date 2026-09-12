/**
 * External dependencies
 */
import { Text } from '@jetpack-premium-analytics/externals';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './highlight-group.module.scss';
import type { ReactNode } from 'react';

export type HighlightFieldProps = {
	/**
	 * The field label (e.g. "Best day").
	 */
	label: string;

	/**
	 * The headline value, already localized.
	 */
	value: ReactNode;

	/**
	 * The unabbreviated value, exposed as a tooltip.
	 */
	valueTitle?: string;

	/**
	 * Muted line under the value (e.g. "17% of views"). Omitted when absent.
	 */
	caption?: string;
};

export type HighlightGroupProps = {
	className?: string;
	children: ReactNode;
};

/**
 * A single labelled highlight: label, prominent value, optional caption.
 */
export function HighlightField( { label, value, valueTitle, caption }: HighlightFieldProps ) {
	return (
		<div className={ styles.field }>
			{ /* The labels carry the card's structure, so a screen reader hears them as headings. */ }
			<Text variant="heading-md" render={ <h4 /> } className={ styles.label }>
				{ label }
			</Text>
			<Text variant="heading-2xl" className={ styles.value } title={ valueTitle }>
				{ value }
			</Text>
			{ caption !== undefined && (
				<Text variant="body-md" className={ styles.caption }>
					{ caption }
				</Text>
			) }
		</div>
	);
}

/**
 * Lays `HighlightField`s out for a widget body: side by side when two columns
 * fit, stacked when they don't, vertically centered either way.
 */
export function HighlightGroup( { className, children }: HighlightGroupProps ) {
	return (
		<div className={ clsx( styles.container, className ) }>
			<div className={ styles.group }>{ children }</div>
		</div>
	);
}
