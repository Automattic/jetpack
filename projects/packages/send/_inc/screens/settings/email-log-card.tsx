import { speak } from '@wordpress/a11y';
import { useDispatch } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { AlertDialog, Card, SelectControl, Stack, Text } from '@wordpress/ui';
import ErrorNotice from '../../components/error-notice';
import { errorMessage, fetchLogSummary, postAction } from '../../data/api';
import { formatCount, parseUtc } from '../../data/dates';
import { SETTINGS_EDIT_PARAM, SETTINGS_HREF } from '../../data/log-link';
import { retentionLabel } from '../../data/period';
import { sendStore, useSendAction } from '../../data/store';
import type { LogSummary, SendStatus } from '../../data/types';

/** The choices, shortest first; 0 keeps emails until they're deleted. */
const RETENTION_DAYS = [ 1, 7, 30, 90, 180, 365, 0 ];

const DAY_MS = 86400000;

type Item = { value: string; label: string };

/**
 * Whether keeping emails for `next` days keeps fewer than `current` (0 is forever).
 *
 * @param next    - The new choice.
 * @param current - The saved one.
 * @return True when older emails would go.
 */
const isShorter = ( next: number, current: number ) =>
	next > 0 && ( current <= 0 || next < current );

/**
 * A day as "Oct 12", with the year when it isn't this one, in the site's timezone.
 *
 * @param when - The moment.
 * @return The day.
 */
function shortDay( when: Date ): string {
	const sameYear = dateI18n( 'Y', when ) === dateI18n( 'Y', new Date() );
	return dateI18n( sameYear ? 'M j' : 'M j, Y', when );
}

/**
 * What a save that deleted older emails says.
 *
 * @param pruned           - What the save deleted, and what's left for the background job.
 * @param pruned.deleted   - Emails deleted now.
 * @param pruned.remaining - Emails still to delete.
 * @return The sentence, or '' when nothing was deleted.
 */
export function prunedText( { deleted, remaining }: { deleted: number; remaining: number } ) {
	if ( deleted > 0 && remaining > 0 ) {
		return sprintf(
			/* translators: 1: emails deleted now, 2: emails still being deleted. */
			_n(
				'Saved. %1$s older email was deleted. The other %2$s are being deleted in the background.',
				'Saved. %1$s older emails were deleted. The other %2$s are being deleted in the background.',
				deleted,
				'jetpack-send-pkg'
			),
			formatCount( deleted ),
			formatCount( remaining )
		);
	}
	if ( deleted > 0 ) {
		return sprintf(
			/* translators: %s: emails deleted. */
			_n(
				'Saved. %s older email was deleted.',
				'Saved. %s older emails were deleted.',
				deleted,
				'jetpack-send-pkg'
			),
			formatCount( deleted )
		);
	}
	if ( remaining > 0 ) {
		return sprintf(
			/* translators: %s: emails still being deleted. */
			_n(
				'Saved. %s older email is being deleted in the background.',
				'Saved. %s older emails are being deleted in the background.',
				remaining,
				'jetpack-send-pkg'
			),
			formatCount( remaining )
		);
	}
	return '';
}

/**
 * How many emails the log holds and since when, or '' before the summary loads.
 *
 * @param summary - The summary.
 * @return The line.
 */
function summaryText( summary: LogSummary | null ): string {
	if ( ! summary ) {
		return '';
	}
	const oldest = summary.oldest_at ? parseUtc( summary.oldest_at ) : null;
	if ( summary.total <= 0 || ! oldest || isNaN( oldest.getTime() ) ) {
		return __( 'The log is empty.', 'jetpack-send-pkg' );
	}
	return sprintf(
		/* translators: 1: number of emails, 2: the day of the oldest, e.g. "Oct 12". */
		_n(
			'The log has %1$s email. The oldest is from %2$s.',
			'The log has %1$s emails. The oldest is from %2$s.',
			summary.total,
			'jetpack-send-pkg'
		),
		formatCount( summary.total ),
		shortDay( oldest )
	);
}

/**
 * What the confirmation says before a shorter choice deletes older emails.
 *
 * @param days  - The new choice.
 * @param older - Emails it deletes; null when the count couldn't load.
 * @return Title and description.
 */
function confirmCopy( days: number, older: number | null ) {
	const outro = __( 'This can’t be undone. Your dashboard numbers stay.', 'jetpack-send-pkg' );
	if ( older === null ) {
		return {
			title: sprintf(
				/* translators: %s: how long, e.g. "1 week". */
				__( 'Delete emails older than %s?', 'jetpack-send-pkg' ),
				retentionLabel( days )
			),
			description: outro,
		};
	}
	return {
		title: sprintf(
			/* translators: %s: number of emails. */
			_n( 'Delete %s older email?', 'Delete %s older emails?', older, 'jetpack-send-pkg' ),
			formatCount( older )
		),
		description: sprintf(
			/* translators: 1: how long, e.g. "1 week", 2: number of emails, 3: a day, e.g. "Oct 12". */
			_n(
				'Keeping emails for %1$s deletes the %2$s email sent before %3$s. This can’t be undone. Your dashboard numbers stay.',
				'Keeping emails for %1$s deletes the %2$s emails sent before %3$s. This can’t be undone. Your dashboard numbers stay.',
				older,
				'jetpack-send-pkg'
			),
			retentionLabel( days ),
			formatCount( older ),
			shortDay( new Date( Date.now() - days * DAY_MS ) )
		),
	};
}

/**
 * Settings › Email log: how long the log keeps emails. A shorter choice asks first with the real
 * number, then deletes the older ones straight away. The dashboard's numbers never change.
 *
 * @param props        - Component props.
 * @param props.status - Send status.
 * @return The card.
 */
const EmailLogCard = ( { status }: { status: SendStatus } ) => {
	const locked = status.log_retention_locked;
	const saved = locked
		? status.log_retention_days
		: ( status.settings.log_retention_days ?? status.log_retention_days );
	const { run, busy, error } = useSendAction();
	const { receiveStatus } = useDispatch( sendStore );
	const [ pending, setPending ] = useState< number | null >( null );
	const shown = pending ?? saved;
	const [ summary, setSummary ] = useState< LogSummary | null >( null );
	const [ summaryKey, setSummaryKey ] = useState( 0 );
	const [ prunedMessage, setPrunedMessage ] = useState( '' );
	const selectRef = useRef< HTMLButtonElement >( null );

	useEffect( () => {
		let cancelled = false;
		fetchLogSummary()
			.then( result => ! cancelled && setSummary( result ) )
			.catch( () => ! cancelled && setSummary( null ) );
		return () => {
			cancelled = true;
		};
	}, [ summaryKey ] );

	// "Change" in the Log and the date popover land here with the select focused.
	const navigate = useNavigate();
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const editRequested = search?.[ SETTINGS_EDIT_PARAM ] === 'log';
	useEffect( () => {
		if ( ! editRequested ) {
			return;
		}
		window.requestAnimationFrame( () => selectRef.current?.focus() );
		navigate( { href: SETTINGS_HREF, replace: true, viewTransition: false } );
		// Runs once per landing.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ editRequested ] );

	const items = useMemo< Item[] >( () => {
		const days = locked ? [ saved ] : RETENTION_DAYS;
		const list = days.map( value => ( {
			value: String( value ),
			label: retentionLabel( value ),
		} ) );
		// A value an older version or the site's code saved still shows as itself.
		return list.some( item => item.value === String( saved ) )
			? list
			: [ ...list, { value: String( saved ), label: retentionLabel( saved ) } ];
	}, [ locked, saved ] );
	const value = items.find( item => item.value === String( shown ) ) ?? null;

	const afterSave = useCallback( ( next: SendStatus ) => {
		const message = next.pruned ? prunedText( next.pruned ) : '';
		setPrunedMessage( message );
		if ( message ) {
			speak( message );
		}
		setSummaryKey( key => key + 1 );
	}, [] );

	const onValueChange = useCallback(
		async ( item: Item | null ) => {
			const days = item ? Number( item.value ) : NaN;
			if ( ! Number.isInteger( days ) || days === saved ) {
				return;
			}
			setPrunedMessage( '' );
			if ( isShorter( days, saved ) ) {
				// The count from when the card opened can be days old, so ask the log again first;
				// if that fails, ask anyway rather than delete without warning.
				let fresh: LogSummary | null;
				try {
					fresh = await fetchLogSummary();
					setSummary( fresh );
				} catch {
					fresh = null;
				}
				const older = fresh
					? ( fresh.older_than[ String( days ) as keyof LogSummary[ 'older_than' ] ] ?? 0 )
					: null;
				if ( older === null || older > 0 ) {
					setPending( days );
					return;
				}
			}
			const next = await run( 'settings', { log_retention_days: days } );
			if ( next ) {
				afterSave( next );
			}
		},
		[ saved, run, afterSave ]
	);

	const onConfirm = useCallback( async () => {
		if ( pending === null ) {
			return;
		}
		try {
			const next = await postAction( 'settings', { log_retention_days: pending } );
			receiveStatus( next );
			afterSave( next );
		} catch ( e ) {
			return { close: false, error: errorMessage( e ) };
		}
	}, [ pending, receiveStatus, afterSave ] );
	const onOpenChange = useCallback( ( open: boolean ) => ! open && setPending( null ), [] );

	// The dialog keeps its words while it closes.
	const lastAsked = useRef< { days: number; older: number | null } >( { days: 7, older: null } );
	if ( pending !== null ) {
		lastAsked.current = {
			days: pending,
			older: summary
				? ( summary.older_than[ String( pending ) as keyof LogSummary[ 'older_than' ] ] ?? 0 )
				: null,
		};
	}
	const confirm = confirmCopy( lastAsked.current.days, lastAsked.current.older );

	let description: string = __(
		'Older emails are deleted for good. Your dashboard numbers stay.',
		'jetpack-send-pkg'
	);
	if ( locked ) {
		description = __( 'Set by your site’s code.', 'jetpack-send-pkg' );
	} else if ( shown <= 0 ) {
		description = __(
			'Emails stay until you delete them. The log grows with every email your site sends.',
			'jetpack-send-pkg'
		);
	}
	const line = summaryText( summary );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Email log', 'jetpack-send-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<Stack direction="column" gap="sm">
						<SelectControl
							ref={ selectRef }
							label={ __( 'Keep emails for', 'jetpack-send-pkg' ) }
							description={ description }
							items={ items }
							value={ value }
							onValueChange={ onValueChange }
							disabled={ locked || !! busy }
						/>
						{ ! locked && ( shown <= 0 || shown >= 365 ) && (
							<Text
								variant="body-md"
								render={ <p /> }
								className="jetpack-send-card__text jetpack-send-muted"
							>
								{ __(
									'Emails can hold your customers’ names, addresses and messages. Keep them only as long as you need them.',
									'jetpack-send-pkg'
								) }
							</Text>
						) }
					</Stack>
					{ prunedMessage && (
						<Text variant="body-md" role="status" className="jetpack-send-saved">
							{ prunedMessage }
						</Text>
					) }
					{ line && (
						<Text
							variant="body-md"
							render={ <p /> }
							role="status"
							className="jetpack-send-card__text jetpack-send-muted"
						>
							{ line }
						</Text>
					) }
					{ error && <ErrorNotice message={ error } /> }
				</Stack>
			</Card.Content>
			<AlertDialog.Root
				open={ pending !== null }
				onOpenChange={ onOpenChange }
				onConfirm={ onConfirm }
			>
				<AlertDialog.Popup
					finalFocus={ selectRef }
					intent="irreversible"
					title={ confirm.title }
					description={ confirm.description }
					confirmButtonText={ __( 'Delete and save', 'jetpack-send-pkg' ) }
				/>
			</AlertDialog.Root>
		</Card.Root>
	);
};

export default EmailLogCard;
