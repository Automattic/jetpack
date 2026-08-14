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
	isLoading: boolean;
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
	const contentRef = useRef< HTMLDivElement >( null );
	const focusToRestore = useRef< HTMLElement | null >( null );

	// Hiding the children makes them unfocusable, and the browser drops focus to
	// the body at the next rendering update. That strands keyboard users who
	// activated something inside the body — a drill-down row, which refetches by
	// definition — at the top of the document. A layout effect runs before that
	// fixup, so it still sees where focus was.
	useLayoutEffect( () => {
		// Read focus through the wrapper's own document, not the global one: the
		// dashboard can be rendered inside an iframe, where they differ.
		const ownerDocument = contentRef.current?.ownerDocument;
		if ( ! ownerDocument ) {
			return;
		}

		if ( showFetchingState ) {
			const active = ownerDocument.activeElement;
			if ( active instanceof HTMLElement && contentRef.current?.contains( active ) ) {
				focusToRestore.current = active;
			}
			return;
		}

		const target = focusToRestore.current;
		focusToRestore.current = null;
		// Only take focus back from the body: anywhere else means the reader moved
		// on during the fetch, and pulling them back would be the worse bug.
		if ( ! target || ownerDocument.activeElement !== ownerDocument.body ) {
			return;
		}
		// A drill-down replaces the rows it was triggered from, so the original
		// target is often gone. The body wrapper is the nearest thing that keeps
		// the next Tab where the reader left off.
		( target.isConnected ? target : contentRef.current )?.focus();
	}, [ showFetchingState ] );

	if ( isError ) {
		// Vertical centering lives in the stylesheet (`safe center`), not the
		// `justify` prop: the prop's inline style would beat the class rule and
		// reintroduce the unreachable-top overflow on short tiles.
		return (
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
	}

	const skeleton = renderLoading ?? <GenericSkeleton />;

	if ( isLoading || ( isEmpty && showFetchingState ) ) {
		// Reached on a refetch too, when the last result was empty. Announce only
		// on first load, so whether a widget speaks up depends on what the user
		// did rather than on what it happened to be showing beforehand.
		return (
			<div className={ styles.loading } aria-hidden={ ! isLoading || undefined }>
				{ skeleton }
			</div>
		);
	}

	if ( isEmpty ) {
		return (
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
	}

	// Keep children mounted during refetches so their state and layout survive.
	return (
		<div className={ styles.ready } aria-busy={ isFetching || undefined }>
			<div
				ref={ contentRef }
				// Not in the tab order; the focus restore above needs somewhere to
				// land when the element it captured is gone.
				tabIndex={ -1 }
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
		</div>
	);
}
