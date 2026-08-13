/**
 * External dependencies
 */
import { Button, Icon, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
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
	/** A refetch is in flight over data already shown (React Query `isFetching`). */
	isFetching?: boolean;
	isError: boolean;
	/** Resolved, but there is nothing meaningful to show. */
	isEmpty: boolean;
	error?: WidgetStateError;
	empty?: WidgetStateEmpty;
	/** Optional content-shaped loading override; defaults to `GenericSkeleton`. */
	renderLoading?: ReactNode;
	/** Success content, rendered only when the state is `ready`. */
	children: ReactNode;
}

/**
 * Data-agnostic widget content-area state. Derives one state from the four
 * signals and renders loading / error / empty / the success children. Knows
 * nothing about the data layer — callers map their fetch result to the signals
 * and pass generic `error` / `empty` descriptors.
 *
 * Priority: error → loading → empty → ready. Any fetch in flight shows the
 * skeleton, refetches included: a refetch here almost always follows a date range
 * or comparison change, which should read as a fresh load rather than stale
 * numbers dimmed under a spinner. The empty state carries no icon by default
 * (staying visually distinct from the error state's glyph); a caller opts in via
 * `empty.icon`.
 *
 * @return The rendered widget state.
 */
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

	// Nothing to keep behind the skeleton: no data yet, or an empty result the
	// children have never rendered against.
	if ( isLoading || ( isEmpty && isFetching ) ) {
		return <div className={ styles.loading }>{ skeleton }</div>;
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

	// Ready and refetching share one tree, so a refetch hides the children
	// instead of unmounting them and the state they own — the selected metric
	// tab, a table's sort and page — survives it.
	return (
		<div className={ styles.ready }>
			<div
				className={ clsx( styles.content, isFetching && styles.contentHidden ) }
				aria-hidden={ isFetching || undefined }
			>
				{ children }
			</div>
			{ isFetching && <div className={ styles.skeletonOverlay }>{ skeleton }</div> }
		</div>
	);
}
