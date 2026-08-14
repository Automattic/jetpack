/**
 * External dependencies
 */
import { Button, Icon, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';
/**
 * Internal dependencies
 */
// Avoid pulling the `widgets/common` graph in through the hooks barrel.
import { useDelayedLoading } from '../../hooks/use-delayed-loading';
import { ChartEmptyState } from '../chart-empty-state';
import { GenericSkeleton } from '../widget-skeleton';
import { errorStateIcon } from './error-state-icon';
import styles from './widget-state.module.scss';
import type { ComponentProps, ReactNode } from 'react';

export interface WidgetStateError {
	title?: string;
	description: string;
	actions?: Array< { label: string; onClick: () => void } >;
}

export interface WidgetStateEmpty {
	icon?: ComponentProps< typeof Icon >[ 'icon' ];
	/** Defaults to "No data in this period." when omitted. */
	description?: string;
}

export interface WidgetStateProps {
	/** A fetch is in flight and there is no data yet (React Query `isLoading`). */
	isLoading: boolean;
	/** A refetch is in flight while data is already shown (React Query `isFetching`). */
	isFetching?: boolean;
	isError: boolean;
	isEmpty: boolean;
	error?: WidgetStateError;
	empty?: WidgetStateEmpty;
	/** Optional content-shaped loading override; defaults to `GenericSkeleton`. */
	renderLoading?: ReactNode;
	children: ReactNode;
}

export function WidgetState( {
	isLoading,
	isFetching = false,
	isError,
	isEmpty,
	error,
	empty,
	renderLoading,
	children,
}: WidgetStateProps ) {
	const showFetchingState = useDelayedLoading( isFetching );
	const rootRef = useRef< HTMLDivElement >( null );
	const contentRef = useRef< HTMLDivElement >( null );
	const focusToRestore = useRef< HTMLElement | null >( null );

	// Hiding the children makes them unfocusable, and the browser drops focus to
	// the body at the next rendering update. That strands keyboard users who
	// activated something inside the body — a drill-down row, which refetches by
	// definition — at the top of the document. A layout effect runs before that
	// fixup, so it still sees where focus was, and can move it somewhere that
	// survives the whole skeleton window rather than only restoring at the end.
	useLayoutEffect( () => {
		// Read focus through the root's own document rather than the global one,
		// so the two reads below cannot end up describing different documents.
		const ownerDocument = rootRef.current?.ownerDocument;
		const view = ownerDocument?.defaultView;
		if ( ! ownerDocument || ! view ) {
			return;
		}

		if ( showFetchingState ) {
			const active = ownerDocument.activeElement;
			// `view.HTMLElement` rather than the global one: elements belong to
			// their own realm's constructor, so a bare `instanceof` can silently
			// never match and the widget would never park.
			const wasInside =
				active instanceof view.HTMLElement && !! contentRef.current?.contains( active );
			// Always assign, so a later refetch can never restore a target this one
			// captured.
			focusToRestore.current = wasInside ? active : null;
			if ( wasInside ) {
				// The root is never hidden, so parking focus here keeps Tab
				// continuing from the widget for the length of the fetch. Nothing
				// moves on screen, so neither should the viewport.
				rootRef.current?.focus( { preventScroll: true } );
			}
			return;
		}

		const target = focusToRestore.current;
		focusToRestore.current = null;
		if ( ! target ) {
			return;
		}
		// Only reclaim focus still sitting exactly where this component left it.
		// Anywhere else means the reader moved on during the fetch, and pulling
		// them back would be the worse bug. The body counts as moved on: the root
		// outlives every state now, so the only way focus reaches the body from
		// here is the reader clicking something unfocusable.
		if ( ownerDocument.activeElement !== rootRef.current ) {
			return;
		}
		// A drill-down replaces the rows it was triggered from, so the original
		// target is often gone; the root keeps the next Tab where it was. A
		// target that survives but refuses focus — disabled, hidden — needs no
		// branch of its own: `focus()` is silent and focus stays parked on the
		// root, which is where that branch would have put it anyway.
		( target.isConnected ? target : rootRef.current )?.focus();
	}, [ showFetchingState ] );

	const skeleton = renderLoading ?? <GenericSkeleton />;
	let body: ReactNode;

	if ( isError ) {
		// Vertical centering lives in the stylesheet (`safe center`), not the
		// `justify` prop: the prop's inline style would beat the class rule and
		// reintroduce the unreachable-top overflow on short tiles.
		body = (
			<Stack className={ styles.state } direction="column" gap="lg" align="center" role="alert">
				<Icon size={ 40 } className={ styles.stateIcon } icon={ errorStateIcon } />
				{ error?.title && <div className={ styles.title }>{ error.title }</div> }
				<div className={ styles.description }>
					{ error?.description ??
						__(
							"We couldn't load this data. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						) }
				</div>
				{ !! error?.actions?.length && (
					<Stack direction="row" gap="sm" justify="center">
						{ error.actions.map( ( action, index ) => (
							<Button
								key={ `${ action.label }-${ index }` }
								type="button"
								variant="outline"
								size="compact"
								onClick={ action.onClick }
							>
								{ action.label }
							</Button>
						) ) }
					</Stack>
				) }
			</Stack>
		);
	} else if ( isLoading || ( isEmpty && showFetchingState ) ) {
		// Reached on a refetch too, when the last result was empty. Announce only
		// on first load, so whether a widget speaks up depends on what the user
		// did rather than on what it happened to be showing beforehand.
		body = (
			<div className={ styles.loading } aria-hidden={ ! isLoading || undefined }>
				{ skeleton }
			</div>
		);
	} else if ( isEmpty ) {
		body = (
			<ChartEmptyState
				// No default icon: the caller opts in via `empty.icon`. Keeping the
				// component icon-agnostic avoids a domain-specific default (e.g. a
				// chart glyph on a non-chart widget) and stays visually distinct from
				// the error state, which always carries its own glyph. `null`
				// suppresses `ChartEmptyState`'s own `cautionFilled` default.
				icon={ empty?.icon ?? null }
				// `ChartEmptyState` supplies the "No data in this period." default when
				// `description` is omitted — keep that copy in one place.
				text={ empty?.description }
			/>
		);
	} else {
		// Keep children mounted during refetches so their state and layout survive.
		body = (
			<>
				<div
					ref={ contentRef }
					className={ clsx( styles.content, showFetchingState && styles.contentHidden ) }
				>
					{ children }
				</div>
				{ /* Avoid announcing one status message per widget during refetches. */ }
				{ showFetchingState && (
					<div className={ styles.skeletonOverlay } aria-hidden="true">
						{ skeleton }
					</div>
				) }
			</>
		);
	}

	// One root for every state, rather than one per branch: focus parked here
	// has to survive a refetch that resolves into the empty or error state, and
	// an element that unmounts underneath it would hand focus back to the
	// document body — the exact thing the parking exists to prevent.
	return (
		<div
			ref={ rootRef }
			// Not in the tab order; only ever focused by the effect above, as the
			// part of the widget body that stays visible through a refetch.
			tabIndex={ -1 }
			className={ styles.root }
			// Gated on the same delay as the skeleton, not on `isFetching`. A
			// refetch that resolves inside the delay changes nothing on screen, so
			// flipping the region busy and back would interrupt a screen reader
			// mid-widget over an update a sighted reader never sees — the opposite
			// of what the delay is for.
			aria-busy={ isLoading || showFetchingState || undefined }
		>
			{ body }
		</div>
	);
}
