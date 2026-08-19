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
	// React Query also reports `isFetching` on the first load; delay only refetches.
	const showFetchingState = useDelayedLoading( isFetching && ! isLoading );
	const rootRef = useRef< HTMLDivElement >( null );
	const contentRef = useRef< HTMLDivElement >( null );
	const focusToRestore = useRef< HTMLElement | null >( null );

	// Park focus before hidden content becomes unfocusable, then restore it after the refetch.
	useLayoutEffect( () => {
		// Use the widget's document to support rendering in another window or iframe.
		const ownerDocument = rootRef.current?.ownerDocument;
		const view = ownerDocument?.defaultView;
		if ( ! ownerDocument || ! view ) {
			return;
		}

		if ( showFetchingState ) {
			const active = ownerDocument.activeElement;
			// Elements must be checked against their own document's constructor.
			const wasInside =
				active instanceof view.HTMLElement && !! contentRef.current?.contains( active );
			// Clear stale targets when focus is outside the widget.
			focusToRestore.current = wasInside ? active : null;
			if ( wasInside ) {
				// The root remains mounted and keeps keyboard navigation at the widget.
				rootRef.current?.focus( { preventScroll: true } );
			}
			return;
		}

		const target = focusToRestore.current;
		focusToRestore.current = null;
		if ( ! target ) {
			return;
		}
		// Do not reclaim focus if the user moved it during the refetch.
		if ( ownerDocument.activeElement !== rootRef.current ) {
			return;
		}
		// Fall back to the root if the original target was removed, without changing the viewport.
		( target.isConnected ? target : rootRef.current )?.focus( { preventScroll: true } );
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
		// Announce the skeleton only on first load, not when refetching an empty result.
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

	// Keep the focus target mounted when a refetch resolves to any state.
	return (
		<div
			ref={ rootRef }
			// Focused programmatically during refetches, but omitted from the tab order.
			tabIndex={ -1 }
			className={ styles.root }
			// Mark only visible refetch skeletons as busy; the first-load skeleton announces itself.
			aria-busy={ showFetchingState || undefined }
		>
			{ body }
		</div>
	);
}
