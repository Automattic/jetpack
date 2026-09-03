/**
 * External dependencies
 */
import { SectionHeader } from '@jetpack-premium-analytics/ui';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import styles from './detail-page-layout.module.scss';
import type { SectionHeaderProps } from '@jetpack-premium-analytics/ui';
import type { ReactNode } from 'react';

/** What a detail page hands the layout's header, owned by the header's own props. */
export type DetailPageHeaderSlots = Pick<
	SectionHeaderProps,
	'visual' | 'title' | 'subTitle' | 'busy'
>;

export interface DetailPageLayoutProps {
	/** The resource's header slots, from the page's `*HeaderSlots` builder. */
	header: DetailPageHeaderSlots;
	/** Date controls for the header row. Omit to leave the header's control cell out. */
	controls?: ReactNode;
	/** The stacked page sections (the widget grid, a notice, …). */
	children: ReactNode;
}

/**
 * Detail page scaffold: the scroll area holding the resource header and the
 * sections below it, so the header scrolls away with them.
 *
 * @param {DetailPageLayoutProps} props - The component props.
 * @return The detail page scaffold.
 */
export function DetailPageLayout( { header, controls, children }: DetailPageLayoutProps ) {
	return (
		<div className={ styles.root }>
			<div className={ styles.header }>
				<SectionHeader headingLevel={ 1 } { ...header }>
					{ controls }
				</SectionHeader>
			</div>
			{ children }
		</div>
	);
}

export interface DetailPageSectionProps {
	children: ReactNode;
	className?: string;
}

/**
 * One content band under the detail header, gutter-aligned with it. It also
 * carries the widget grid's gap and Card padding, which a grid inside inherits.
 *
 * @param {DetailPageSectionProps} props - The component props.
 * @return The section.
 */
export function DetailPageSection( { children, className }: DetailPageSectionProps ) {
	return <div className={ clsx( styles.section, className ) }>{ children }</div>;
}
