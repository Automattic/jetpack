/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button, Icon, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { ChartEmptyState } from '../chart-empty-state';
import { WidgetLoadingOverlay } from '../widget-loading-overlay';
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
	description: string;
}

export interface WidgetStateProps {
	/** A fetch is in flight and there is no data yet (React Query `isLoading`). */
	isLoading: boolean;
	/** A background refetch is in flight while data is shown (React Query `isFetching`). */
	isFetching?: boolean;
	isError: boolean;
	/** Resolved, but there is nothing meaningful to show. */
	isEmpty: boolean;
	error?: WidgetStateError;
	empty?: WidgetStateEmpty;
	/** Optional per-widget loading override (e.g. a chart skeleton). */
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
 * Priority: error → loading (first load) → empty → ready. During a background
 * refetch (`isFetching` with data) the children stay visible under a busy
 * overlay. The empty state carries no icon by default (staying visually distinct
 * from the error state's glyph); a caller opts in via `empty.icon`.
 *
 * @param props               - Component props.
 * @param props.isLoading     - A fetch is in flight and there is no data yet.
 * @param props.isFetching    - A background refetch is in flight while data is shown.
 * @param props.isError       - Whether the fetch failed.
 * @param props.isEmpty       - Resolved, but there is nothing meaningful to show.
 * @param props.error         - Error descriptor shown when `isError` is true.
 * @param props.empty         - Empty-state descriptor; renders no icon unless `empty.icon` is set.
 * @param props.renderLoading - Optional per-widget loading override.
 * @param props.children      - Success content, rendered only when the state is `ready`.
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
		return (
			<Stack
				className={ styles.state }
				direction="column"
				gap="lg"
				align="center"
				justify="center"
				role="alert"
			>
				<Icon size={ 40 } icon={ errorStateIcon } />
				{ error?.title && <div className={ styles.title }>{ error.title }</div> }
				<div className={ styles.description }>
					{ error?.description ??
						__(
							"We couldn't load this data. Please try again in a moment.",
							'jetpack-premium-analytics'
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

	// `isLoading` blocks unconditionally — it means "no data yet", so there is
	// nothing to keep visible regardless of how the caller derived `isEmpty`.
	// `isFetching` only blocks when the resolved data is empty; with rows shown
	// it falls through to the ready branch's non-blocking busy overlay.
	if ( isLoading || ( isEmpty && isFetching ) ) {
		return <>{ renderLoading ?? <WidgetLoadingOverlay /> }</>;
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
				text={
					empty?.description ??
					__( 'No data found for this date range.', 'jetpack-premium-analytics' )
				}
			/>
		);
	}

	return (
		<div className={ styles.ready }>
			{ children }
			{ isFetching && (
				<div className={ styles.busy } aria-hidden="true">
					<WidgetLoadingOverlay />
				</div>
			) }
		</div>
	);
}
