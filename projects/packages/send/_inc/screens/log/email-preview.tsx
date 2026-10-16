import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Dialog, Notice, Spinner, getWpCompatOverlaySlot } from '@wordpress/ui';
import ErrorNotice from '../../components/error-notice';
import { errorMessage, fetchLogEntry } from '../../data/api';
import StatusBadge, { logDate } from './status-badge';
import type { LogAddress, LogEntry, LogMessage, LogRow } from '../../data/types';

// With no sandbox tokens for scripts or same-origin, the CSP only has to stop frames, objects, and fetches.
const FRAME_HEAD = [
	'<meta charset="utf-8">',
	`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: http: data:; style-src 'unsafe-inline' https: http:; font-src https: http: data:">`,
	'<base target="_blank">',
	'<style>body{margin:0;padding:24px;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#1e1e1e;overflow-wrap:anywhere}</style>',
].join( '' );

const formatAddress = ( { email, name }: LogAddress ) =>
	name ? `${ name } <${ email }>` : email;

const Envelope = ( { row, message }: { row: LogRow; message: LogMessage | null } ) => {
	let sender = '';
	if ( message ) {
		sender = message.from
			? message.from.name || message.from.email
			: __( 'Your host’s default sender', 'jetpack-send-pkg' );
	}
	const lines: [ string, string ][] = [ [ __( 'To', 'jetpack-send-pkg' ), row.recipients ] ];
	if ( message?.cc.length ) {
		lines.push( [ __( 'Cc', 'jetpack-send-pkg' ), message.cc.map( formatAddress ).join( ', ' ) ] );
	}
	if ( message?.bcc.length ) {
		lines.push( [
			__( 'Bcc', 'jetpack-send-pkg' ),
			message.bcc.map( formatAddress ).join( ', ' ),
		] );
	}
	if ( message?.reply_to ) {
		lines.push( [ __( 'Reply to', 'jetpack-send-pkg' ), formatAddress( message.reply_to ) ] );
	}

	return (
		<div className="jetpack-send-email__envelope">
			{ sender && (
				<span className="jetpack-send-sender-preview__avatar" aria-hidden="true">
					{ sender.charAt( 0 ).toUpperCase() }
				</span>
			) }
			<div className="jetpack-send-email__meta">
				{ sender && (
					<div className="jetpack-send-email__sender">
						<span className="jetpack-send-email__name">{ sender }</span>
						{ message?.from?.name && (
							<span className="jetpack-send-email__address">&lt;{ message.from.email }&gt;</span>
						) }
					</div>
				) }
				<dl className="jetpack-send-email__recipients">
					{ lines.map( ( [ label, value ] ) => (
						<div key={ label }>
							<dt>{ label }</dt>
							<dd>{ value }</dd>
						</div>
					) ) }
				</dl>
			</div>
			<span className="jetpack-send-email__date">{ logDate( row.created_at ) }</span>
		</div>
	);
};

const Body = ( { message }: { message: LogMessage } ) => (
	<>
		{ message.content_type === 'text/html' ? (
			<iframe
				className="jetpack-send-email__frame"
				title={ __( 'Email content', 'jetpack-send-pkg' ) }
				sandbox="allow-popups allow-popups-to-escape-sandbox"
				srcDoc={ `<!doctype html><html><head>${ FRAME_HEAD }</head><body>${ message.body }</body></html>` }
			/>
		) : (
			<div className="jetpack-send-email__text">{ message.body }</div>
		) }
		{ message.attachments.length > 0 && (
			<ul
				className="jetpack-send-email__attachments"
				aria-label={ __( 'Attachments', 'jetpack-send-pkg' ) }
			>
				{ message.attachments.map( ( filename, index ) => (
					<li key={ `${ index }-${ filename }` }>{ filename }</li>
				) ) }
			</ul>
		) }
	</>
);

type Props = {
	row: LogRow | null;
	open: boolean;
	onClose: () => void;
};

const EmailPreview = ( { row, open, onClose }: Props ) => {
	const [ entry, setEntry ] = useState< LogEntry | null >( null );
	const [ error, setError ] = useState< string | null >( null );

	useEffect( () => {
		if ( ! row ) {
			return;
		}
		let cancelled = false;
		setEntry( null );
		setError( null );
		fetchLogEntry( row.id )
			.then( result => ! cancelled && setEntry( result ) )
			.catch( e => ! cancelled && setError( errorMessage( e ) ) );
		return () => {
			cancelled = true;
		};
	}, [ row ] );

	const onOpenChange = useCallback( ( isOpen: boolean ) => ! isOpen && onClose(), [ onClose ] );

	return (
		<Dialog.Root open={ open } onOpenChange={ onOpenChange }>
			<Dialog.Popup
				size="large"
				className="jetpack-send-email"
				// Dialogs don't use the overlay slot by default; without it the wp-admin menu covers this one.
				portal={ <Dialog.Portal container={ getWpCompatOverlaySlot() } /> }
			>
				{ row && (
					<>
						<Dialog.Header>
							<div className="jetpack-send-email__heading">
								<Dialog.Title>
									{ row.subject || __( '(No subject)', 'jetpack-send-pkg' ) }
								</Dialog.Title>
								<StatusBadge status={ row.status } />
							</div>
							<Dialog.CloseIconButton />
						</Dialog.Header>
						<Dialog.Content>
							<div className="jetpack-send-email__content">
								{ row.error && (
									<Notice.Root intent={ row.status === 'failed' ? 'error' : 'warning' }>
										<Notice.Title>
											{ row.status === 'failed'
												? __( 'Not delivered', 'jetpack-send-pkg' )
												: __( 'Handed to your host’s mail', 'jetpack-send-pkg' ) }
										</Notice.Title>
										<Notice.Description>{ row.error }</Notice.Description>
									</Notice.Root>
								) }
								{ error && <ErrorNotice message={ error } /> }
								{ ! entry && ! error && <Spinner /> }
								{ entry && (
									<div className="jetpack-send-email__message">
										<Envelope row={ row } message={ entry.message } />
										{ entry.message ? (
											<Body message={ entry.message } />
										) : (
											<p className="jetpack-send-email__empty">
												{ __( 'No preview is available for this email.', 'jetpack-send-pkg' ) }
											</p>
										) }
									</div>
								) }
							</div>
						</Dialog.Content>
					</>
				) }
			</Dialog.Popup>
		</Dialog.Root>
	);
};

export default EmailPreview;
