/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { cautionFilled } from '@wordpress/icons';
import { Button, Icon, Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { ChartEmptyState } from '../chart-empty-state';
import { WidgetLoadingOverlay } from '../widget-loading-overlay';
import styles from './widget-state.module.scss';
import type { ComponentProps, ReactNode } from 'react';

export interface WidgetStateError {
	title?: string;
	description: string;
	actions?: Array< { label: string; onClick: () => void } >;
}

export interface WidgetStateEmpty {
	icon?: ComponentProps< typeof Icon >[ 'icon' ];
	title?: string;
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
 * overlay.
 *
 * @param props               - Component props.
 * @param props.isLoading     - A fetch is in flight and there is no data yet.
 * @param props.isFetching    - A background refetch is in flight while data is shown.
 * @param props.isError       - Whether the fetch failed.
 * @param props.isEmpty       - Resolved, but there is nothing meaningful to show.
 * @param props.error         - Error descriptor shown when `isError` is true.
 * @param props.empty         - Empty-state descriptor shown when `isEmpty` is true.
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
			<Stack className={ styles.state } align="center" justify="center">
				<Icon className={ styles.errorIcon } size={ 48 } icon={ cautionFilled } />
				{ error?.title && <div className={ styles.title }>{ error.title }</div> }
				<div className={ styles.description }>
					{ error?.description ??
						__(
							"We couldn't load this data. Please try again in a moment.",
							'jetpack-premium-analytics'
						) }
				</div>
				{ !! error?.actions?.length && (
					<Stack className={ styles.actions } direction="row" justify="center">
						{ error.actions.map( action => (
							<Button
								key={ action.label }
								type="button"
								variant="secondary"
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

	if ( isEmpty && ( isLoading || isFetching ) ) {
		return <>{ renderLoading ?? <WidgetLoadingOverlay /> }</>;
	}

	if ( isEmpty ) {
		return (
			<ChartEmptyState
				icon={ empty?.icon }
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
