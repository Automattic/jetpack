import { speak } from '@wordpress/a11y';
import { date as siteDate } from '@wordpress/date';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { copyToClipboard } from '../../components/copy-button';
import { parseUtc, siteToday } from '../../data/dates';
import {
	SUPPORT_URL,
	failureCopy,
	failureReason,
	failureTitle,
	hostActions,
	hostLine,
} from '../../data/failure-reasons';
import { ADVANCED_SETTINGS_HREF } from '../../data/log-link';
import type { FailureAction } from '../../data/failure-reasons';
import type { FailureDetail, LogRow } from '../../data/types';

export type FailureNoticeProps = {
	/** A failed or host-sent row. */
	row: LogRow;
	/** The row's stored detail; null on older rows or before the entry loads. */
	detail: FailureDetail | null;
	/** The plain-text report Copy details copies; '' until the entry loads. */
	supportText: string;
	/** The email can be resent (`entry.resend.allowed`). */
	canResend: boolean;
	/** The sending domain. */
	domain: string;
	/** Accounts come from the local development provisioner. */
	devMode: boolean;
	/** Go to an in-app href. */
	onNavigate: ( href: string ) => void;
	/** Open the resend dialog, on "Someone else" when asked. */
	onResend: ( someoneElse: boolean ) => void;
};

/**
 * When the plan's count starts again, for an email stopped by the limit this month: the first day of
 * next month, site-local, as This month counts it. Undefined for an older month's email, whose reset
 * has passed.
 *
 * @param createdAt - The row's UTC time.
 * @return Site-local `Y-m-d`, or undefined.
 */
export function limitResetsOn( createdAt: string ): string | undefined {
	const sent = parseUtc( createdAt );
	const month = siteToday().slice( 0, 7 );
	if ( isNaN( sent.getTime() ) || siteDate( 'Y-m', sent ) !== month ) {
		return undefined;
	}
	const [ year, monthNumber ] = month.split( '-' ).map( Number );
	const next = new Date( Date.UTC( year, monthNumber, 1 ) );
	return next.toISOString().slice( 0, 10 );
}

/**
 * "Copy details" as a notice action: copies the report, says "Copied" for a moment, and announces it.
 *
 * @param props      - Component props.
 * @param props.text - The report.
 * @return The action.
 */
const CopyDetailsAction = ( { text }: { text: string } ) => {
	const [ copied, setCopied ] = useState( false );
	const timer = useRef< ReturnType< typeof setTimeout > | null >( null );
	useEffect( () => () => timer.current && clearTimeout( timer.current ), [] );
	const onClick = useCallback( async () => {
		if ( ! ( await copyToClipboard( text ) ) ) {
			speak( __( 'Couldn’t copy. Select the text and copy it yourself.', 'jetpack-send-pkg' ) );
			return;
		}
		setCopied( true );
		speak( __( 'Details copied.', 'jetpack-send-pkg' ) );
		if ( timer.current ) {
			clearTimeout( timer.current );
		}
		timer.current = setTimeout( () => setCopied( false ), 2000 );
	}, [ text ] );
	return (
		<Notice.ActionButton variant="outline" onClick={ onClick }>
			{ copied ? __( 'Copied', 'jetpack-send-pkg' ) : __( 'Copy details', 'jetpack-send-pkg' ) }
		</Notice.ActionButton>
	);
};

/**
 * Why an email didn't go out through Send, in plain words: Send's headline, then its one next step,
 * or what the host's mail did instead. The actions come from Send's reason, else the host's outcome.
 * The service's own words stay under Technical details.
 *
 * @param props             - Component props.
 * @param props.row         - A failed or host-sent row.
 * @param props.detail      - The stored detail.
 * @param props.supportText - The report for Copy details.
 * @param props.canResend   - The email can be resent.
 * @param props.domain      - The sending domain.
 * @param props.devMode     - Development accounts.
 * @param props.onNavigate  - Go to an in-app href.
 * @param props.onResend    - Open the resend dialog.
 * @return The notice.
 */
const FailureNotice = ( {
	row,
	detail,
	supportText,
	canResend,
	domain,
	devMode,
	onNavigate,
	onResend,
}: FailureNoticeProps ) => {
	const reason = failureReason( row );
	const hostSent = row.status === 'fallback';
	const isTest = row.source === 'test';
	const copy = failureCopy( reason, {
		domain,
		plugin: row.origin_label || undefined,
		devMode,
		isTest,
		fallback: hostSent,
		canResend,
		resetsOn: reason === 'limit' ? limitResetsOn( row.created_at ) : undefined,
	} );
	const host = hostLine( row.status, detail, reason );
	// It went out (host-sent), or the host's mail failed too: the host's line takes the step's place.
	const description = [ copy.headline, host || copy.step ].filter( Boolean ).join( ' ' );
	let actions: FailureAction[] = copy.actions;
	if ( ! actions.length && ! hostSent ) {
		actions = hostActions( detail );
	}
	actions = actions.filter( action => action !== 'copy_details' || !! supportText );
	const checkRecords = useCallback( () => onNavigate( '/' ), [ onNavigate ] );
	const openAdvanced = useCallback( () => onNavigate( ADVANCED_SETTINGS_HREF ), [ onNavigate ] );
	const resend = useCallback( () => onResend( false ), [ onResend ] );
	const resendOther = useCallback( () => onResend( true ), [ onResend ] );

	return (
		<Notice.Root intent={ hostSent ? 'warning' : 'error' }>
			<Notice.Title>{ failureTitle( reason, isTest ) }</Notice.Title>
			{ description && <Notice.Description>{ description }</Notice.Description> }
			{ actions.length > 0 && (
				<Notice.Actions>
					{ actions.map( action => {
						switch ( action ) {
							case 'check_records':
								return (
									<Notice.ActionButton key={ action } variant="outline" onClick={ checkRecords }>
										{ __( 'Check your records', 'jetpack-send-pkg' ) }
									</Notice.ActionButton>
								);
							case 'open_advanced':
								return (
									<Notice.ActionButton key={ action } variant="outline" onClick={ openAdvanced }>
										{ __( 'Open Advanced settings', 'jetpack-send-pkg' ) }
									</Notice.ActionButton>
								);
							case 'contact_support':
								return (
									<Notice.ActionLink key={ action } href={ SUPPORT_URL } openInNewTab>
										{ __( 'Contact support', 'jetpack-send-pkg' ) }
									</Notice.ActionLink>
								);
							case 'resend':
							case 'resend_other':
								return (
									<Notice.ActionButton
										key={ action }
										variant="outline"
										onClick={ action === 'resend_other' ? resendOther : resend }
									>
										{ __( 'Resend', 'jetpack-send-pkg' ) }
									</Notice.ActionButton>
								);
							default:
								return <CopyDetailsAction key={ action } text={ supportText } />;
						}
					} ) }
				</Notice.Actions>
			) }
		</Notice.Root>
	);
};

export default FailureNotice;
