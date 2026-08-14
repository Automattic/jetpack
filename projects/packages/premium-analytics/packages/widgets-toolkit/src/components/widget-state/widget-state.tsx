/**
 * External dependencies
 */
import { Button, Icon, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
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
			<div className={ clsx( styles.content, showFetchingState && styles.contentHidden ) }>
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
