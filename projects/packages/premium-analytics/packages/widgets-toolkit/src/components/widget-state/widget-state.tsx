/**
 * External dependencies
 */
import { Button, Icon, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
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
import type { ComponentProps, FocusEvent, ReactNode } from 'react';

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
	/**
	 * Nothing on screen answers the current params: a first load, or a param
	 * change still showing the previous response. Pass the data hook's
	 * `isLoading`, which is already widened to cover both.
	 */
	isLoading: boolean;
	/**
	 * Unchanged params being revalidated (React Query `isFetching`). Draws
	 * nothing — the numbers on screen are still the right answer.
	 */
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
	// `isFetching` is true on the first load too, and a quick revalidation is not
	// worth announcing.
	const isRevalidating = useDelayedLoading( isFetching && ! isLoading );

	const rootRef = useRef< HTMLDivElement >( null );
	// What the reader is standing on inside this widget, so the effect below can
	// tell "their element was taken away" from "they walked off".
	const focusedInside = useRef< HTMLElement | null >( null );

	const rememberFocus = ( event: FocusEvent< HTMLDivElement > ) => {
		focusedInside.current = event.target;
	};

	const forgetFocus = ( event: FocusEvent< HTMLDivElement > ) => {
		// An element on its way out fires focusout in some browsers and not in
		// others. Keep it either way: that is the case the effect below exists for.
		if ( ! event.target.isConnected ) {
			return;
		}
		// Moving within the widget is not leaving it.
		if ( ! event.currentTarget.contains( event.relatedTarget ) ) {
			focusedInside.current = null;
		}
	};

	// Deliberately unconditional — every non-ready branch unmounts the children and
	// drops focus to <body>, including a same-branch row swap under unchanged params.
	useLayoutEffect( () => {
		const target = focusedInside.current;
		const root = rootRef.current;
		// Use the widget's own document to support rendering in another window.
		const ownerDocument = root?.ownerDocument;
		if ( ! target || ! root || ! ownerDocument ) {
			return;
		}
		// A target still in the document is not something this widget dropped.
		if ( target.isConnected ) {
			return;
		}
		// Held past the render that dropped it, it would let the next fall to <body>
		// anywhere on the page pull focus in here.
		focusedInside.current = null;
		// Step in only for focus this widget just dropped: focus that went
		// anywhere but <body> is not ours to move.
		if ( ownerDocument.activeElement !== ownerDocument.body ) {
			return;
		}
		root.focus( { preventScroll: true } );
	} );

	const skeleton = renderLoading ?? <GenericSkeleton />;
	let body: ReactNode;

	if ( isError ) {
		// Vertical centering lives in the stylesheet (`safe center`), not the `justify`
		// prop, whose inline style would beat it and clip the top on short tiles.
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
	} else if ( isLoading ) {
		body = <div className={ styles.loading }>{ skeleton }</div>;
	} else if ( isEmpty ) {
		body = (
			<ChartEmptyState
				// No default icon: `null` suppresses `ChartEmptyState`'s own
				// `cautionFilled`, which would read as an error state here.
				icon={ empty?.icon ?? null }
				// `ChartEmptyState` supplies the "No data in this period." default when
				// `description` is omitted — keep that copy in one place.
				text={ empty?.description }
			/>
		);
	} else {
		body = <div className={ styles.content }>{ children }</div>;
	}

	return (
		<div
			ref={ rootRef }
			// Focused programmatically when a branch change drops the reader's
			// element, but never in the tab order itself.
			tabIndex={ -1 }
			className={ styles.root }
			onFocus={ rememberFocus }
			onBlur={ forgetFocus }
			// A marker, not an announcement: on a roleless container most screen
			// readers stay quiet, which is the point — nothing on screen moved.
			aria-busy={ isRevalidating || undefined }
		>
			{ body }
		</div>
	);
}
