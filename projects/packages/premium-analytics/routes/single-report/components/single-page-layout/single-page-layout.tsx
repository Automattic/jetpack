/**
 * External dependencies
 */
import { DataForm } from '@jetpack-premium-analytics/externals';
import { SectionHeader } from '@jetpack-premium-analytics/ui';
import { useReducedMotion } from '@wordpress/compose';
import { useEffect, useMemo, useRef } from '@wordpress/element';
/**
 * Internal dependencies
 */
import styles from './single-page-layout.module.scss';
import type { SingleReportHeaderSlots } from '../../pages';
import type { Field } from '@jetpack-premium-analytics/externals';
import type { JSX, ReactNode } from 'react';

// The controls render in a row beside the title, without labels.
const CONTROL_LAYOUT = { type: 'regular', labelPosition: 'none' } as const;
const FORM_LAYOUT = { type: 'row', alignment: 'center' } as const;

export type SinglePageLayoutProps = {
	/*
	 * The entity's header slots; omit for a page-level state that stands in for the entity.
	 */
	header?: SingleReportHeaderSlots;

	/*
	 * The section tabs of a page with inner navigation. They scroll away; the header pins.
	 */
	tabs?: ReactNode;

	/*
	 * The fields of the page's controls, rendered in the header; none for a page without controls.
	 */
	controls?: Field< never >[];

	/*
	 * The item the controls edit: the report window and the All time anchor.
	 */
	data?: Record< string, unknown >;

	/*
	 * Receives the edits a control commits.
	 */
	onChange?: ( edits: Record< string, unknown > ) => void;

	/*
	 * Each new defined value scrolls back to the top and moves focus to the title: a card below
	 * the fold re-scoped the cards above it.
	 */
	returnToTopKey?: number;

	/*
	 * The page body: the widgets, a notice, an empty state.
	 */
	children: ReactNode;
};

/**
 * The body of a single-report page under `Page`: the tabs, a pinned header with the entity's
 * visual, title, subtitle and controls, and the content scrolling under it.
 *
 * @param {SinglePageLayoutProps} props - The props.
 * @return The layout.
 */
export function SinglePageLayout( {
	header,
	tabs,
	controls,
	data,
	onChange,
	returnToTopKey,
	children,
}: SinglePageLayoutProps ): JSX.Element {
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

	const form = useMemo(
		() => ( {
			layout: FORM_LAYOUT,
			fields: ( controls ?? [] ).map( field => ( { id: field.id, layout: CONTROL_LAYOUT } ) ),
		} ),
		[ controls ]
	);

	return (
		<div ref={ scrollArea } className={ styles.scroll }>
			{ tabs }
			{ header && (
				<SectionHeader
					pinned
					titleRef={ title }
					busy={ header.busy }
					visual={ header.visual ?? <span /> }
					title={ header.title }
					subTitle={ header.subTitle }
				>
					{ controls?.length && data && onChange ? (
						<DataForm
							data={ data }
							fields={ controls as never }
							form={ form }
							onChange={ onChange }
						/>
					) : null }
				</SectionHeader>
			) }

			<div className={ styles.content }>{ children }</div>
		</div>
	);
}
