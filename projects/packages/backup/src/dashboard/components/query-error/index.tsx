import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import { useEffect, useId, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice } from '@wordpress/ui';
import { announce, cancelAnnouncement } from '../../data/announce';
import { errorCode } from '../../data/api/_helpers';
import { useSiteSuffix } from '../../hooks/use-connection';
import { useFocusHandoff } from '../../hooks/use-focus-handoff';
import ErrorReference from '../error-reference';
import './style.scss';
import type { ReferenceId } from '../../types/failure-reference';
import type { RefObject } from 'react';

type Props = {
	/** What failed, in the reader's terms. */
	title: string;
	/**
	 * The query's error, when there is one. Nullable because not every
	 * failure produces one: a route that cannot decode WordPress.com's
	 * answer still returns a bare `null` body served as HTTP 200, so the
	 * request resolves and the caller's only evidence is its own derived
	 * state. Those callers still
	 * need to report the failure — they just have no detail line to add.
	 */
	error?: Error | null;
	/** The id of what failed, quoted beside the error code. */
	referenceId?: ReferenceId;
	/** Refetches the failed query. Omitted when the caller has no way to retry. */
	onRetry?: () => void;
	/** Adds a Contact support link, for a failure the reader cannot fix. */
	withSupportLink?: boolean;
	/** Whether a retry is in flight. */
	isRetrying?: boolean;
	/** Where focus goes if the notice goes away while holding it, as after a successful retry. */
	returnFocusTo?: RefObject< HTMLElement | null >;
	/** Shown but not spoken, for a notice that restates one already announced beside it. */
	silent?: boolean;
	/**
	 * Extra class for the notice, which has no margin of its own; a caller
	 * in ordinary flow adds its own spacing.
	 */
	className?: string;
};

/**
 * Inline report for a query that failed.
 *
 * Exists because "the request failed" and "there is nothing here" are
 * indistinguishable in this dashboard by default: React Query hands back
 * an error, the consumer reads only `isLoading` and `data`, and an empty
 * `data` renders the same empty state either way. A reader whose
 * activity log 5xx'd is told their site has no activity.
 *
 * The upstream message is shown verbatim alongside the friendly line.
 * It is the only part a support agent can act on, and the bridges
 * already translate WPCOM's failures into human-readable text.
 *
 * `isRetrying` matters more than it looks. React Query defines
 * `isLoading` as `isPending && isFetching`, and a query sitting in the
 * error state is never pending — so a refetch leaves `isLoading` false
 * for its whole duration. Without a separate signal the button would not
 * change, and a retry that failed again would leave the DOM
 * byte-identical to before the click, which reads as a dead control.
 *
 * @param props                 - Component props.
 * @param props.title           - What failed, in the reader's terms.
 * @param props.error           - The query's error.
 * @param props.referenceId     - The id of what failed, quoted beside the error code.
 * @param props.onRetry         - Refetches the failed query, when the caller can.
 * @param props.withSupportLink - Whether to add a Contact support link.
 * @param props.isRetrying      - Whether a retry is currently in flight.
 * @param props.returnFocusTo   - Where focus goes if the notice goes away while holding it.
 * @param props.silent          - Whether to leave the notice unannounced.
 * @param props.className       - Extra class for the notice.
 * @return The rendered error.
 */
export default function QueryError( {
	title,
	error,
	referenceId,
	onRetry,
	withSupportLink = false,
	isRetrying = false,
	returnFocusTo,
	silent = false,
	className,
}: Props ) {
	const siteSuffix = useSiteSuffix();
	const message = [ title, error?.message ].filter( Boolean ).join( ' ' );
	const code = errorCode( error );
	const id = referenceId ?? null;
	const previous = useRef( { isRetrying, message: '' } );
	const source = useId();
	const rootRef = useFocusHandoff< HTMLDivElement >( returnFocusTo );

	// Spoken here, not by `Notice.Root`, so failures that land together are heard together.
	// A retry that fails the same way is spoken again: the message did not change, but the attempt did.
	useEffect( () => {
		const failedAgain =
			previous.current.isRetrying && ! isRetrying && previous.current.message === message;
		if ( ! silent && ( message !== previous.current.message || failedAgain ) ) {
			announce( message, 'assertive', source );
		}
		previous.current = { isRetrying, message };
	}, [ isRetrying, message, silent, source ] );

	useEffect(
		() => () => {
			cancelAnnouncement( source );
			// Forgotten too, so StrictMode's remount speaks again what this cleanup withdrew.
			previous.current = { isRetrying: false, message: '' };
		},
		[ source ]
	);

	return (
		<Notice.Root
			ref={ rootRef }
			intent="error"
			className={ [ 'jpb-query-error', className ].filter( Boolean ).join( ' ' ) }
		>
			<Notice.Title>{ title }</Notice.Title>
			{ error?.message && <Notice.Description>{ error.message }</Notice.Description> }
			{ ( code || id ) && (
				// A div, since `Text` is a span and the reference is a block.
				<Notice.Description render={ <div /> }>
					<ErrorReference code={ code } id={ id } />
				</Notice.Description>
			) }
			{ ( onRetry || withSupportLink ) && (
				<Notice.Actions>
					{ onRetry && (
						<Button
							variant="solid"
							tone="brand"
							size="compact"
							onClick={ onRetry }
							loading={ isRetrying }
							loadingAnnouncement={ __( 'Retrying', 'jetpack-backup-pkg' ) }
						>
							{ __( 'Try again', 'jetpack-backup-pkg' ) }
						</Button>
					) }
					{ withSupportLink && (
						<Notice.ActionLink
							openInNewTab
							// Omitted rather than passed as undefined — see `useSiteSuffix`.
							href={ getRedirectUrl(
								'jetpack-contact-support',
								siteSuffix ? { site: siteSuffix } : {}
							) }
						>
							{ __( 'Contact support', 'jetpack-backup-pkg' ) }
						</Notice.ActionLink>
					) }
				</Notice.Actions>
			) }
		</Notice.Root>
	);
}
