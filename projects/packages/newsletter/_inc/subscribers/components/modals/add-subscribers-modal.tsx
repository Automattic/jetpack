import { DropZone, TextareaControl } from '@wordpress/components';
import {
	createInterpolateElement,
	useCallback,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { check, cloudUpload, Icon } from '@wordpress/icons';
import { Button, Dialog, Notice, Stack, Tabs, Text } from '@wordpress/ui';
import { useAddSubscribersMutation } from '../../data/use-add-subscribers-mutation';
import { isJobInProgress, isJobStale, useImportJobs } from '../../data/use-import-jobs';
import { useResetImportMutation } from '../../data/use-reset-import-mutation';
import { extractEmailsFromCsv } from '../../lib/csv-parse';
import { recordTracksEvent } from '../../lib/tracks';
import './add-subscribers-modal.scss';
import type { ImportJob } from '../../data/types';

type Props = {
	isOpen: boolean;
	onClose: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Help-center articles for exporting a subscriber list from each supported platform, linked from
// the CSV upload tab the same way Calypso links them.
const PLATFORM_EXPORT_URLS = {
	beehiiv: 'https://www.beehiiv.com/support/article/12234988536215-how-to-export-subscribers',
	ghost: 'https://ghost.org/help/exports/#members',
	kit: 'https://help.kit.com/en/articles/2502489-how-to-export-subscribers-in-kit',
	mailchimp: 'https://mailchimp.com/help/view-export-contacts/',
	medium: 'https://help.medium.com/hc/en-us/articles/360059837393-Email-subscriptions',
	patreon:
		'https://support.patreon.com/hc/en-gb/articles/360004385971-How-do-I-manage-my-members#h_01EQGYDNF2J3XR12ABBMTZPSQM',
};

// Text formats the importer accepts. The picker's `accept` attribute and the drag-and-drop
// validation both derive from this single list, so click-to-upload and drop enforce the same set.
const ACCEPTED_CSV_EXTENSIONS = [ 'csv', 'txt', 'tsv' ];
const ACCEPTED_CSV_ACCEPT_ATTR = [
	...ACCEPTED_CSV_EXTENSIONS.map( extension => `.${ extension }` ),
	'text/csv',
	'text/plain',
].join( ',' );

/**
 * Whether a file is one of the accepted text exports, by extension. Extension-based because CSV
 * MIME types are unreliable (often empty or `application/vnd.ms-excel`), and this matches the
 * `accept` attribute the file picker already advertises — so a dropped file is held to the same
 * rule the picker enforces.
 *
 * @param file - Candidate file.
 * @return True when the extension is one we parse.
 */
function isAcceptedCsvFile( file: File ): boolean {
	const name = file.name.toLowerCase();
	const dot = name.lastIndexOf( '.' );
	const extension = dot === -1 ? '' : name.slice( dot + 1 );
	return ACCEPTED_CSV_EXTENSIONS.includes( extension );
}

type TabValue = 'manual' | 'upload' | 'substack';

/**
 * Consent + large-import notice shown under both the manual and CSV entry forms, mirroring the copy
 * Calypso shows on its own Add Subscribers flow.
 *
 * @return Two-paragraph notice.
 */
function ImportConsentNotice(): JSX.Element {
	return (
		// Match the muted gray of the WordPress control "help" text the notice sits beneath.
		<Stack
			direction="column"
			gap="xs"
			style={ { color: 'var(--wpds-color-foreground-content-neutral-weak)' } }
		>
			<Text variant="body-sm">
				{ __(
					'Imports of more than 10,000 subscribers will go through a manual review before being added to your site.',
					'jetpack-newsletter'
				) }
			</Text>
			<Text variant="body-sm">
				{ __(
					'By clicking “Add subscribers,” you represent that you’ve obtained the appropriate consent to email each person. Spam complaints or high bounce rate from your subscribers may lead to action against your account.',
					'jetpack-newsletter'
				) }
			</Text>
		</Stack>
	);
}

/**
 * Calypso's Substack importer wizard. We don't reimplement the multi-step Stripe / paid-plan
 * flow inside the dashboard — we link out, the same way Calypso does on its own subscribers page.
 *
 * @param hostname - Current site hostname (used as the WPCOM site slug).
 * @return Absolute URL.
 */
function getSubstackImportUrl( hostname: string ): string {
	const params = new URLSearchParams( {
		ref: 'wp-admin-newsletter-ui',
		siteSlug: hostname,
	} );
	return `https://wordpress.com/setup/site-setup/importerSubstack?${ params.toString() }`;
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

/**
 * Status notice shown while WP.com is running an import for this site (one import runs per site
 * at a time, so the form below is disabled). The stale variant mirrors Calypso's
 * `StaleImportJobsNotice`: after 24 hours a stuck job gets a "Cancel import" escape hatch — or,
 * when a previous job was already cancelled, a pointer to support.
 *
 * @param props      - Component props.
 * @param props.jobs - Import jobs, newest first.
 * @return Notice element, or null when no import is running.
 */
function ImportStatusNotice( { jobs }: { jobs: ImportJob[] } ): JSX.Element | null {
	const resetMutation = useResetImportMutation();
	const handleCancelImport = useCallback( () => resetMutation.mutate(), [ resetMutation ] );

	if ( ! jobs.some( isJobInProgress ) ) {
		return null;
	}

	// Each variant carries a `key` (remount instead of reusing the previous variant's hook
	// state) and an explicit string `spokenMessage` — Notice.Root otherwise renderToString()s
	// its children mid-render, which corrupts hook order when they include action buttons.
	if ( ! jobs.some( job => isJobStale( job ) ) ) {
		const inProgressMessage = __(
			'Your subscribers are being imported. This may take a few minutes. You can close this window and we’ll notify you when the import is complete.',
			'jetpack-newsletter'
		);
		return (
			<Notice.Root key="import-in-progress" intent="info" spokenMessage={ inProgressMessage }>
				<Notice.Description>{ inProgressMessage }</Notice.Description>
			</Notice.Root>
		);
	}

	// Mirrors Calypso: once a reset has already been tried (the previous job shows as
	// cancelled), another "Cancel import" is unlikely to help — point at support instead.
	if ( jobs[ 1 ]?.status === 'cancelled' ) {
		const contactSupportMessage = __(
			'Your recent import is taking longer than expected to complete. If this issue persists, please contact our support team for assistance.',
			'jetpack-newsletter'
		);
		return (
			<Notice.Root
				key="import-stale-support"
				intent="warning"
				spokenMessage={ contactSupportMessage }
			>
				<Notice.Description>{ contactSupportMessage }</Notice.Description>
				<Notice.Actions>
					<Notice.ActionLink
						href="https://jetpack.com/support/newsletter/import-subscribers/"
						openInNewTab
					>
						{ __( 'Learn more', 'jetpack-newsletter' ) }
					</Notice.ActionLink>
				</Notice.Actions>
			</Notice.Root>
		);
	}

	const staleMessage = __(
		'Your recent import is taking longer than expected to complete. Please cancel your import and try again.',
		'jetpack-newsletter'
	);
	return (
		<Notice.Root key="import-stale" intent="warning" spokenMessage={ staleMessage }>
			<Notice.Description>{ staleMessage }</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton onClick={ handleCancelImport } loading={ resetMutation.isPending }>
					{ __( 'Cancel import', 'jetpack-newsletter' ) }
				</Notice.ActionButton>
			</Notice.Actions>
		</Notice.Root>
	);
}

type SubmitButtonProps = {
	count: number;
	isPending: boolean;
	disabled?: boolean;
	onClick: () => void;
};

/**
 * Primary submit button reused by both the manual + upload tabs. Pluralizes the label and
 * disables itself when the user has nothing to submit.
 *
 * @param props           - Component props.
 * @param props.count     - Number of valid emails to import.
 * @param props.isPending - Whether the underlying mutation is in flight.
 * @param props.disabled  - Whether submitting is blocked (an import is already running).
 * @param props.onClick   - Submit handler.
 * @return Submit button.
 */
function SubmitButton( { count, isPending, disabled, onClick }: SubmitButtonProps ): JSX.Element {
	const label =
		count > 0
			? sprintf(
					// translators: %d: number of subscribers to add.
					_n( 'Add %d subscriber', 'Add %d subscribers', count, 'jetpack-newsletter' ),
					count
			  )
			: __( 'Add subscribers', 'jetpack-newsletter' );
	return (
		<Button
			onClick={ onClick }
			loading={ isPending }
			disabled={ disabled || isPending || count === 0 }
		>
			{ label }
		</Button>
	);
}

type AddTabProps = {
	mutation: ReturnType< typeof useAddSubscribersMutation >;
	// True while WP.com is already running an import — submitting would be rejected upstream.
	importInProgress: boolean;
	onClose: () => void;
};

/**
 * Manual entry tab. Plain textarea + same forgiving comma/semicolon/whitespace parser the
 * original modal shipped with.
 *
 * @param props                  - Component props.
 * @param props.mutation         - Shared add-subscribers mutation handle.
 * @param props.importInProgress - Whether an import is already running.
 * @param props.onClose          - Close handler invoked after a successful submit.
 * @return Tab body.
 */
function ManualTab( { mutation, importInProgress, onClose }: AddTabProps ): JSX.Element {
	const [ value, setValue ] = useState( '' );

	// Submit button reflects the *live* value so the user never has to wait to submit — typing one
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
					'Enter one email per line. We’ll automatically clean duplicate, incomplete, outdated, or spammy emails.',
					'jetpack-newsletter'
				) }
				value={ value }
				onChange={ handleChange }
				onBlur={ handleBlur }
				rows={ 6 }
				placeholder="reader@example.com&#10;another@example.com"
			/>
			<ImportConsentNotice />
			<InvalidEntriesNotice invalid={ invalid } />
			<Stack direction="row" justify="end" gap="sm">
				<SubmitButton
					count={ valid.length }
					isPending={ mutation.isPending }
					disabled={ importInProgress }
					onClick={ handleSubmit }
				/>
			</Stack>
		</Stack>
	);
}

type CsvDropzoneProps = {
	// Name of the currently selected file, or null before one is chosen.
	fileName: string | null;
	// Whether selection is blocked (an import is already in flight).
	disabled: boolean;
	// Called with the picked or dropped file.
	onFile: ( file: File ) => void;
	// Ref to the hidden <input>, shared with UploadTab so it can reset the value after a submit.
	inputRef: React.RefObject< HTMLInputElement >;
};

/**
 * Clickable + drag-and-drop CSV drop area. Visually replaces the bare file input: the real
 * `<input>` stays in the DOM but hidden and is driven through `inputRef`, so a click anywhere in the
 * box — or a keyboard activation — opens the native picker. Core's `<DropZone>` (the same primitive
 * the modernized VideoPress Library uses) overlays the box and handles the drag-and-drop, showing
 * its accent-colored "drop to upload" overlay while a file is dragged over. The inactive DropZone is
 * `visibility: hidden`, so it never blocks the click target underneath.
 *
 * @param props          - Component props.
 * @param props.fileName - Name of the selected file, or null.
 * @param props.disabled - Whether selection is blocked.
 * @param props.onFile   - Picked/dropped file handler.
 * @param props.inputRef - Ref to the hidden file input.
 * @return Drop area element.
 */
function CsvDropzone( { fileName, disabled, onFile, inputRef }: CsvDropzoneProps ): JSX.Element {
	const openPicker = useCallback( () => {
		if ( ! disabled ) {
			inputRef.current?.click();
		}
	}, [ disabled, inputRef ] );

	const handleInputChange = useCallback(
		( event: React.ChangeEvent< HTMLInputElement > ) => {
			const file = event.target.files?.[ 0 ];
			if ( file ) {
				onFile( file );
			}
		},
		[ onFile ]
	);

	const handleFilesDrop = useCallback(
		( files: File[] ) => {
			const file = files?.[ 0 ];
			if ( file ) {
				onFile( file );
			}
		},
		[ onFile ]
	);

	const className = [ 'jetpack-newsletter__csv-dropzone', fileName && 'has-file' ]
		.filter( Boolean )
		.join( ' ' );

	return (
		<div className="jetpack-newsletter__csv-dropzone-wrap">
			<button type="button" className={ className } onClick={ openPicker } disabled={ disabled }>
				<Icon
					className="jetpack-newsletter__csv-dropzone-icon"
					icon={ fileName ? check : cloudUpload }
					size={ 32 }
				/>
				<Text variant="body-md">
					{ fileName ?? __( 'Drag a file here, or click to upload a file', 'jetpack-newsletter' ) }
				</Text>
			</button>
			{ ! disabled && (
				<DropZone
					icon={ cloudUpload }
					label={ __( 'Drop your CSV file to upload', 'jetpack-newsletter' ) }
					onFilesDrop={ handleFilesDrop }
				/>
			) }
			<input
				ref={ inputRef }
				type="file"
				accept={ ACCEPTED_CSV_ACCEPT_ATTR }
				className="jetpack-newsletter__csv-dropzone-input"
				onChange={ handleInputChange }
				disabled={ disabled }
			/>
		</div>
	);
}

/**
 * CSV upload tab. We don't have multipart pass-through against WPCOM yet, so the file is parsed
 * client-side and the resulting emails are POSTed to the existing `/subscribers/add` proxy. The
 * parser tolerates CSVs from Substack, Beehiiv, Mailchimp, Ghost, Patreon, Kit and Medium because
 * it just pulls email-shaped substrings out of the raw text.
 *
 * @param props                  - Component props.
 * @param props.mutation         - Shared add-subscribers mutation handle.
 * @param props.importInProgress - Whether an import is already running.
 * @param props.onClose          - Close handler invoked after a successful submit.
 * @return Tab body.
 */
function UploadTab( { mutation, importInProgress, onClose }: AddTabProps ): JSX.Element {
	const fileInputRef = useRef< HTMLInputElement | null >( null );
	const [ fileName, setFileName ] = useState< string | null >( null );
	const [ emails, setEmails ] = useState< string[] >( [] );
	const [ readError, setReadError ] = useState< string | null >( null );

	const handleFile = useCallback( ( file: File ) => {
		// Drag-and-drop can deliver any file type, so enforce the same allow-list the picker
		// advertises rather than reading an arbitrary file as text.
		if ( ! isAcceptedCsvFile( file ) ) {
			setFileName( null );
			setEmails( [] );
			setReadError(
				__(
					'That file type isn’t supported. Please upload a CSV file (.csv, .txt, or .tsv).',
					'jetpack-newsletter'
				)
			);
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
				{ createInterpolateElement(
					__(
						'Upload a CSV file with your existing subscribers list from platforms like <beehiiv>Beehiiv</beehiiv>, <ghost>Ghost</ghost>, <kit>Kit</kit>, <mailchimp>Mailchimp</mailchimp>, <medium>Medium</medium>, <patreon>Patreon</patreon>, and many others.',
						'jetpack-newsletter'
					),
					{
						beehiiv: <a href={ PLATFORM_EXPORT_URLS.beehiiv } target="_blank" rel="noreferrer" />,
						ghost: <a href={ PLATFORM_EXPORT_URLS.ghost } target="_blank" rel="noreferrer" />,
						kit: <a href={ PLATFORM_EXPORT_URLS.kit } target="_blank" rel="noreferrer" />,
						mailchimp: (
							<a href={ PLATFORM_EXPORT_URLS.mailchimp } target="_blank" rel="noreferrer" />
						),
						medium: <a href={ PLATFORM_EXPORT_URLS.medium } target="_blank" rel="noreferrer" />,
						patreon: <a href={ PLATFORM_EXPORT_URLS.patreon } target="_blank" rel="noreferrer" />,
					}
				) }
			</Text>
			<CsvDropzone
				fileName={ fileName }
				disabled={ mutation.isPending }
				onFile={ handleFile }
				inputRef={ fileInputRef }
			/>
			<ImportConsentNotice />
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
					disabled={ importInProgress }
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
		window.location.href = importUrl;
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
 * Modal that imports new subscribers by email. Three tabs — manual entry, CSV upload, and a
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
	const importJobsQuery = useImportJobs( isOpen );

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

	const importJobs = importJobsQuery.data ?? [];
	const importInProgress = importJobs.some( isJobInProgress );

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup>
				<Dialog.Header>
					<Dialog.Title>{ __( 'Add subscribers', 'jetpack-newsletter' ) }</Dialog.Title>
					<Dialog.CloseIcon />
				</Dialog.Header>
				<Dialog.Content>
					<Stack direction="column" gap="lg">
						<ImportStatusNotice jobs={ importJobs } />
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
								<ManualTab
									mutation={ mutation }
									importInProgress={ importInProgress }
									onClose={ onClose }
								/>
							</Tabs.Panel>
							<Tabs.Panel value="upload">
								<UploadTab
									mutation={ mutation }
									importInProgress={ importInProgress }
									onClose={ onClose }
								/>
							</Tabs.Panel>
							<Tabs.Panel value="substack">
								<SubstackTab />
							</Tabs.Panel>
						</Tabs.Root>
					</Stack>
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
