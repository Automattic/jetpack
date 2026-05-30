import { TextareaControl } from '@wordpress/components';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Dialog, Notice, Stack, Tabs, Text } from '@wordpress/ui';
import { useAddSubscribersMutation } from '../../data/use-add-subscribers-mutation';
import { extractEmailsFromCsv } from '../../lib/csv-parse';
import { recordTracksEvent } from '../../lib/tracks';

type Props = {
	isOpen: boolean;
	onClose: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type TabValue = 'manual' | 'upload' | 'substack';

/**
 * Calypso's Substack importer wizard. We don't reimplement the multi-step Stripe / paid-plan
 * flow inside the dashboard — we link out, the same way Calypso does on its own subscribers page.
 *
 * @param hostname - Current site hostname (used as the WPCOM site slug).
 * @return Absolute URL.
 */
function getSubstackImportUrl( hostname: string ): string {
	return `https://wordpress.com/import/newsletter/substack/${ encodeURIComponent( hostname ) }`;
}

/**
 * Split a textarea body into individual addresses. Accepts newlines, commas, semicolons, or
 * whitespace as separators — same forgiving parser Calypso uses.
 *
 * @param raw - Raw textarea content.
 * @return Trimmed, non-empty entries.
 */
function splitEntries( raw: string ): string[] {
	return raw
		.split( /[\s,;]+/ )
		.map( entry => entry.trim() )
		.filter( Boolean );
}

/**
 * Sort a list of entries into valid + invalid emails using the same predicate the table search
 * field uses. Keeps both lists deterministic for the inline warning UI.
 *
 * @param entries - Candidate strings.
 * @return Sorted-and-categorized result.
 */
function partitionEmails( entries: string[] ): { valid: string[]; invalid: string[] } {
	return {
		valid: entries.filter( entry => EMAIL_RE.test( entry ) ),
		invalid: entries.filter( entry => ! EMAIL_RE.test( entry ) ),
	};
}

/**
 * Inline warning for entries that couldn't be parsed as emails.
 *
 * @param props         - Component props.
 * @param props.invalid - Entries that failed the email predicate.
 * @return Notice element, or null when the list is empty.
 */
function InvalidEntriesNotice( { invalid }: { invalid: string[] } ): JSX.Element | null {
	if ( invalid.length === 0 ) {
		return null;
	}
	return (
		<Notice.Root intent="warning">
			<Notice.Description>
				{ sprintf(
					// translators: %s: comma-separated list of invalid email addresses.
					__(
						'These entries don’t look like valid email addresses and will be skipped: %s',
						'jetpack-newsletter'
					),
					invalid.slice( 0, 8 ).join( ', ' ) +
						( invalid.length > 8 ? `, +${ invalid.length - 8 }` : '' )
				) }
			</Notice.Description>
		</Notice.Root>
	);
}

type SubmitButtonProps = {
	count: number;
	isPending: boolean;
	onClick: () => void;
};

/**
 * Primary submit button reused by both the manual + upload tabs. Pluralizes the label and
 * disables itself when the user has nothing to submit.
 *
 * @param props           - Component props.
 * @param props.count     - Number of valid emails to invite.
 * @param props.isPending - Whether the underlying mutation is in flight.
 * @param props.onClick   - Submit handler.
 * @return Submit button.
 */
function SubmitButton( { count, isPending, onClick }: SubmitButtonProps ): JSX.Element {
	const label =
		count > 0
			? sprintf(
					// translators: %d: number of subscribers to invite.
					_n( 'Invite %d subscriber', 'Invite %d subscribers', count, 'jetpack-newsletter' ),
					count
			  )
			: __( 'Add subscribers', 'jetpack-newsletter' );
	return (
		<Button onClick={ onClick } loading={ isPending } disabled={ isPending || count === 0 }>
			{ label }
		</Button>
	);
}

type AddTabProps = {
	mutation: ReturnType< typeof useAddSubscribersMutation >;
	onClose: () => void;
};

/**
 * Manual entry tab. Plain textarea + same forgiving comma/semicolon/whitespace parser the
 * original modal shipped with.
 *
 * @param props          - Component props.
 * @param props.mutation - Shared add-subscribers mutation handle.
 * @param props.onClose  - Close handler invoked after a successful submit.
 * @return Tab body.
 */
function ManualTab( { mutation, onClose }: AddTabProps ): JSX.Element {
	const [ value, setValue ] = useState( '' );

	// Submit button reflects the *live* value so the user never has to wait to invite — typing one
	// valid email enables the CTA right away.
	const { valid } = useMemo( () => partitionEmails( splitEntries( value ) ), [ value ] );

	// Inline warning only updates when the textarea loses focus, so a half-typed `reader@`
	// doesn't flash a "looks invalid" notice mid-word. We hold the most-recently-blurred value
	// and re-partition that — clearing it again as the user starts typing again so a stale
	// warning isn't shown after the user starts fixing it.
	const [ blurredValue, setBlurredValue ] = useState( '' );
	const handleChange = useCallback(
		( next: string ) => {
			setValue( next );
			if ( blurredValue !== '' ) {
				setBlurredValue( '' );
			}
		},
		[ blurredValue ]
	);
	const handleBlur = useCallback( () => setBlurredValue( value ), [ value ] );
	const { invalid } = useMemo(
		() => partitionEmails( splitEntries( blurredValue ) ),
		[ blurredValue ]
	);

	const handleSubmit = useCallback( () => {
		if ( valid.length === 0 ) {
			return;
		}
		mutation.mutate( valid, {
			onSuccess: () => {
				setValue( '' );
				setBlurredValue( '' );
				onClose();
			},
		} );
	}, [ mutation, onClose, valid ] );

	return (
		<Stack direction="column" gap="md">
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Email addresses', 'jetpack-newsletter' ) }
				help={ __(
					'Enter one email per line. Subscribers receive an invitation by email.',
					'jetpack-newsletter'
				) }
				value={ value }
				onChange={ handleChange }
				onBlur={ handleBlur }
				rows={ 6 }
				placeholder="reader@example.com&#10;another@example.com"
			/>
			<InvalidEntriesNotice invalid={ invalid } />
			<Stack direction="row" justify="end" gap="sm">
				<SubmitButton
					count={ valid.length }
					isPending={ mutation.isPending }
					onClick={ handleSubmit }
				/>
			</Stack>
		</Stack>
	);
}

/**
 * CSV upload tab. We don't have multipart pass-through against WPCOM yet, so the file is parsed
 * client-side and the resulting emails are POSTed to the existing `/subscribers/add` proxy. The
 * parser tolerates CSVs from Substack, Beehiiv, Mailchimp, Ghost, Patreon, Kit and Medium because
 * it just pulls email-shaped substrings out of the raw text.
 *
 * @param props          - Component props.
 * @param props.mutation - Shared add-subscribers mutation handle.
 * @param props.onClose  - Close handler invoked after a successful submit.
 * @return Tab body.
 */
function UploadTab( { mutation, onClose }: AddTabProps ): JSX.Element {
	const fileInputRef = useRef< HTMLInputElement | null >( null );
	const [ fileName, setFileName ] = useState< string | null >( null );
	const [ emails, setEmails ] = useState< string[] >( [] );
	const [ readError, setReadError ] = useState< string | null >( null );

	const handleFileChange = useCallback( ( event: React.ChangeEvent< HTMLInputElement > ) => {
		const file = event.target.files?.[ 0 ];
		if ( ! file ) {
			return;
		}
		setFileName( file.name );
		setReadError( null );
		setEmails( [] );

		const reader = new FileReader();
		reader.onerror = () => {
			setReadError( __( 'Could not read the file. Try again.', 'jetpack-newsletter' ) );
		};
		reader.onload = () => {
			const text = typeof reader.result === 'string' ? reader.result : '';
			setEmails( extractEmailsFromCsv( text ) );
		};
		reader.readAsText( file );
	}, [] );

	const handleSubmit = useCallback( () => {
		if ( emails.length === 0 ) {
			return;
		}
		mutation.mutate( emails, {
			onSuccess: () => {
				setEmails( [] );
				setFileName( null );
				if ( fileInputRef.current ) {
					fileInputRef.current.value = '';
				}
				onClose();
			},
		} );
	}, [ mutation, onClose, emails ] );

	return (
		<Stack direction="column" gap="md">
			<Text variant="body-md">
				{ __(
					'Upload a CSV from Substack, Beehiiv, Mailchimp, Ghost, Patreon, Kit or Medium. We’ll pick the email column for you and send each address an invitation.',
					'jetpack-newsletter'
				) }
			</Text>
			<input
				ref={ fileInputRef }
				type="file"
				accept=".csv,.txt,.tsv,text/csv,text/plain"
				onChange={ handleFileChange }
				disabled={ mutation.isPending }
			/>
			{ readError ? (
				<Notice.Root intent="error">
					<Notice.Description>{ readError }</Notice.Description>
				</Notice.Root>
			) : null }
			{ fileName && ! readError ? (
				<Text variant="body-sm">
					{ sprintf(
						// translators: %1$s: file name. %2$d: number of email addresses found.
						_n(
							'Found %2$d email address in %1$s.',
							'Found %2$d email addresses in %1$s.',
							emails.length,
							'jetpack-newsletter'
						),
						fileName,
						emails.length
					) }
				</Text>
			) : null }
			<Stack direction="row" justify="end" gap="sm">
				<SubmitButton
					count={ emails.length }
					isPending={ mutation.isPending }
					onClick={ handleSubmit }
				/>
			</Stack>
		</Stack>
	);
}

/**
 * Substack tab. Calypso's importer is a multi-step wizard with Stripe + paid-plan mapping; we
 * link out to it instead of reimplementing it inside the modal — this matches the click-through
 * Calypso itself does from its Add Subscribers picker.
 *
 * @return Tab body.
 */
function SubstackTab(): JSX.Element {
	const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
	const importUrl = getSubstackImportUrl( hostname );

	const handleOpen = useCallback( () => {
		window.open( importUrl, '_blank', 'noopener,noreferrer' );
	}, [ importUrl ] );

	return (
		<Stack direction="column" gap="md">
			<Text variant="body-md">
				{ __(
					'Bring your Substack publication over: posts, paid plans (when applicable) and subscribers. The Substack importer runs as a guided wizard on WordPress.com.',
					'jetpack-newsletter'
				) }
			</Text>
			<Stack direction="row" justify="end" gap="sm">
				<Button onClick={ handleOpen }>
					{ __( 'Open Substack importer', 'jetpack-newsletter' ) }
				</Button>
			</Stack>
		</Stack>
	);
}

/**
 * Modal that invites new subscribers by email. Three tabs — manual entry, CSV upload, and a
 * Substack importer hand-off — share a single `useAddSubscribersMutation` so the snackbar
 * feedback + dashboard cache invalidation behave identically across tabs. (Calypso also has a
 * "Migrate from another WordPress.com site" flow; we don't ship it from inside the in-admin
 * dashboard yet because its `/me/sites` lookup needs an oauth token the Jetpack-as-user proxy
 * can't supply server-side. Tracked in #48365 — Phase 5b deferred.)
 *
 * @param props         - Component props.
 * @param props.isOpen  - Whether the modal is open.
 * @param props.onClose - Close handler.
 * @return Modal element or null when closed.
 */
export default function AddSubscribersModal( { isOpen, onClose }: Props ): JSX.Element | null {
	const mutation = useAddSubscribersMutation();
	const [ tab, setTab ] = useState< TabValue >( 'manual' );

	const handleOpenChange = useCallback(
		( nextOpen: boolean ) => {
			if ( ! nextOpen ) {
				onClose();
			}
		},
		[ onClose ]
	);

	const handleTabChange = useCallback( ( next: string ) => {
		setTab( next as TabValue );
		// Calypso fires `calypso_subscribers_add_question` per import-method tile click, with a
		// `method` prop. We mirror it on every tab switch so reviewers can read tab-engagement
		// stats the same way.
		recordTracksEvent( 'jetpack_subscribers_add_question', { method: next } );
	}, [] );

	if ( ! isOpen ) {
		return null;
	}

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup>
				<Dialog.Header>
					<Dialog.Title>{ __( 'Add subscribers', 'jetpack-newsletter' ) }</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
				<Tabs.Root
					value={ tab }
					onValueChange={ handleTabChange }
					render={ <Stack direction="column" gap="lg" /> }
				>
					<Tabs.List variant="minimal">
						<Tabs.Tab value="manual">{ __( 'Manual', 'jetpack-newsletter' ) }</Tabs.Tab>
						<Tabs.Tab value="upload">{ __( 'Upload CSV', 'jetpack-newsletter' ) }</Tabs.Tab>
						<Tabs.Tab value="substack">{ __( 'Substack', 'jetpack-newsletter' ) }</Tabs.Tab>
					</Tabs.List>
					<Tabs.Panel value="manual">
						<ManualTab mutation={ mutation } onClose={ onClose } />
					</Tabs.Panel>
					<Tabs.Panel value="upload">
						<UploadTab mutation={ mutation } onClose={ onClose } />
					</Tabs.Panel>
					<Tabs.Panel value="substack">
						<SubstackTab />
					</Tabs.Panel>
				</Tabs.Root>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
