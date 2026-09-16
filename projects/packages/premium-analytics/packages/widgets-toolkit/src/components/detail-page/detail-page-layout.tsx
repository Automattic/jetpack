/**
 * External dependencies
 */
import { SectionHeader } from '@jetpack-premium-analytics/ui';
import { useReducedMotion } from '@wordpress/compose';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
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
	/** Tab bar for a page with several views. It scrolls away with the content; the header pins. */
	tabs?: ReactNode;
	/** Date controls for the header row. Omit to leave the header's control cell out. */
	controls?: ReactNode;
	/**
	 * Each new defined value brings the scroll area back to its top and moves
	 * focus to the header: for a card below the fold that re-scoped the cards
	 * above it, leaving the reader looking at nothing that changed.
	 */
	returnToTopKey?: number;
	/** The stacked page sections (the widget grid, a notice, …). */
	children: ReactNode;
}

/**
 * Detail page scaffold: the scroll area holding the tabs, the resource header
 * pinned at its top, and the sections that scroll under it.
 *
 * @param {DetailPageLayoutProps} props - The component props.
 * @return The detail page scaffold.
 */
export function DetailPageLayout( {
	header,
	tabs,
	controls,
	returnToTopKey,
	children,
}: DetailPageLayoutProps ) {
	const scrollArea = useRef< HTMLDivElement >( null );
	const title = useRef< HTMLHeadingElement >( null );
	const reducedMotion = useReducedMotion();

	useEffect( () => {
		if ( returnToTopKey === undefined ) {
			return;
		}
		// Focus first, without scrolling: the focus jump would cut the smooth scroll short.
		title.current?.focus( { preventScroll: true } );
		scrollArea.current?.scrollTo?.( { top: 0, behavior: reducedMotion ? 'auto' : 'smooth' } );
		// Only a new key returns the reader to the top; a motion preference flip alone must not.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ returnToTopKey ] );

	return (
		<div ref={ scrollArea } className={ styles.root }>
			{ tabs }
			<SectionHeader pinned titleRef={ title } { ...header }>
				{ controls }
			</SectionHeader>
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
