import apiFetch from '@wordpress/api-fetch';
import { dateI18n } from '@wordpress/date';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { arrowDown, check, close, copySmall } from '@wordpress/icons';
import {
	Button,
	Dialog,
	Icon,
	IconButton,
	Notice,
	Spinner,
	Stack,
	Text,
	Tooltip,
} from '@wordpress/ui';
import { SCAN_PATH } from './store';
import type { ScanThreat } from './types';
import type { RenderModalProps } from '@wordpress/dataviews';

const COPIED_DURATION = 15000;

type ThreatFile = { path: string; modified: string | null; contents: string };

/** A flagged stretch of the file, as first and last line indexes. */
type Run = [ number, number ];

/**
 * The name of the file a threat is in, such as "index.php".
 *
 * @param threat - The threat.
 * @return The name.
 */
const getThreatFileName = ( threat: ScanThreat | undefined ) =>
	threat?.filename?.split( '/' ).pop() ?? '';

/**
 * The viewer's title: "Opening… index.php" while it loads, then "Open: index.php".
 *
 * @param threat    - The threat.
 * @param isLoading - Whether the file is still loading.
 * @return The title.
 */
export const getThreatFileTitle = ( threat: ScanThreat | undefined, isLoading = false ) =>
	isLoading
		? sprintf(
				/* translators: %s is a file name, such as "index.php". */
				__( 'Opening… %s', 'jetpack-protect-pkg' ),
				getThreatFileName( threat )
			)
		: sprintf(
				/* translators: %s is a file name, such as "index.php". */
				__( 'Open: %s', 'jetpack-protect-pkg' ),
				getThreatFileName( threat )
			);

/**
 * Where Scan's flagged lines are in the file: at their line numbers when those still match, else
 * wherever the whole block matches, so a common line like `}` alone can't flag the file.
 *
 * @param lines   - The file's lines.
 * @param context - The flagged lines Scan reported.
 * @return The flagged runs, in file order.
 */
export function getFlaggedRuns(
	lines: string[],
	context: { line: number; code: string }[] = []
): Run[] {
	const block = [ ...context ]
		.sort( ( a, b ) => a.line - b.line )
		.map( ( { line, code } ) => ( { line, code: code.replace( /\r?\n$/, '' ) } ) );
	if ( ! block.length ) {
		return [];
	}
	const first = block[ 0 ].line;
	const span = block[ block.length - 1 ].line - first;
	const matchesAt = ( start: number ) =>
		block.every( ( { line, code } ) => lines[ start + line - first ] === code );

	if ( first >= 1 && matchesAt( first - 1 ) ) {
		return [ [ first - 1, first - 1 + span ] ];
	}
	const runs: Run[] = [];
	for ( let start = 0; start + span < lines.length; start++ ) {
		if ( matchesAt( start ) ) {
			runs.push( [ start, start + span ] );
		}
	}
	return runs;
}

/**
 * Copy the file's path, with the label as a tooltip that shows at once and says "Copied" for a while after.
 *
 * @param props      - Component props.
 * @param props.path - The file's path.
 * @return The button.
 */
function CopyPathButton( { path }: { path: string } ) {
	const [ copied, setCopied ] = useState( false );
	const timer = useRef< ReturnType< typeof setTimeout > >( undefined );
	const copy = useCallback( () => {
		navigator.clipboard?.writeText( path ).then( () => {
			setCopied( true );
			clearTimeout( timer.current );
			timer.current = setTimeout( () => setCopied( false ), COPIED_DURATION );
		} );
	}, [ path ] );
	useEffect( () => () => clearTimeout( timer.current ), [] );
	const label = copied
		? __( 'Copied', 'jetpack-protect-pkg' )
		: __( 'Copy file path', 'jetpack-protect-pkg' );

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				delay={ 0 }
				closeOnClick={ false }
				render={
					<Button
						variant="minimal"
						tone="neutral"
						size="compact"
						aria-label={ label }
						onClick={ copy }
					/>
				}
			>
				<Icon icon={ copied ? check : copySmall } size={ 20 } />
			</Tooltip.Trigger>
			<Tooltip.Popup>{ label }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

/**
 * When the file last changed, and where it is.
 *
 * @param props      - Component props.
 * @param props.file - The file.
 * @return The header.
 */
function FileMeta( { file }: { file: ThreatFile } ) {
	return (
		<Stack direction="column" gap="xs">
			{ file.modified && (
				<Text variant="body-sm" className="jp-protect-card__muted">
					{ sprintf(
						/* translators: %s is a date, such as "Aug 15, 2026, 7:00 AM". */
						__( 'Last modified %s', 'jetpack-protect-pkg' ),
						dateI18n( 'M j, Y, g:i A', file.modified, undefined )
					) }
				</Text>
			) }
			<Stack direction="row" gap="xs" align="center">
				<code className="jp-protect-threat-file__path">{ file.path }</code>
				<CopyPathButton path={ file.path } />
			</Stack>
		</Stack>
	);
}

type ThreatFileState = { file: ThreatFile | null; error: string | null };

/**
 * Fetch the file a threat was found in.
 *
 * @param threat - The threat.
 * @return The file once loaded, or why it couldn't be.
 */
function useThreatFile( threat: ScanThreat | undefined ): ThreatFileState {
	const [ state, setState ] = useState< ThreatFileState >( { file: null, error: null } );
	useEffect( () => {
		if ( ! threat ) {
			return;
		}
		let current = true;
		apiFetch< ThreatFile >( { path: `${ SCAN_PATH }/threats/${ threat.id }/file` } )
			.then( file => current && setState( { file, error: null } ) )
			.catch(
				( e: { message?: string } ) =>
					current &&
					setState( {
						file: null,
						error: e?.message || __( 'This file couldn’t be loaded.', 'jetpack-protect-pkg' ),
					} )
			);
		return () => {
			current = false;
		};
	}, [ threat ] );
	return state;
}

/**
 * The whole file a threat was found in, with Scan's flagged lines highlighted.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @param props.file   - The file, once loaded.
 * @param props.error  - Why it couldn't be loaded.
 * @return The file.
 */
function ThreatFileBody( {
	threat,
	file,
	error,
}: ThreatFileState & { threat: ScanThreat | undefined } ) {
	const [ shown, setShown ] = useState( 0 );
	const code = useRef< HTMLPreElement >( null );

	const lines = useMemo( () => file?.contents.split( /\r?\n/ ) ?? [], [ file ] );
	const runs = useMemo( () => getFlaggedRuns( lines, threat?.context ), [ lines, threat ] );
	const isFlagged = ( index: number ) =>
		runs.some( ( [ start, end ] ) => index >= start && index <= end );

	useEffect( () => {
		code.current
			?.querySelector( `[data-run="${ shown }"]` )
			?.scrollIntoView( { block: 'center', behavior: 'smooth' } );
	}, [ file, shown ] );

	const showNext = useCallback( () => setShown( index => ( index + 1 ) % runs.length ), [ runs ] );

	if ( error ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>{ error }</Notice.Description>
			</Notice.Root>
		);
	}
	if ( ! file ) {
		return <Spinner />;
	}
	return (
		<Stack direction="column" gap="md">
			<FileMeta file={ file } />
			{ threat?.context?.length && ! runs.length ? (
				<Text variant="body-md">
					{ __(
						'The flagged code isn’t in this file anymore. It may have changed since the last scan.',
						'jetpack-protect-pkg'
					) }
				</Text>
			) : null }
			{ runs.length > 1 && (
				<Stack direction="row" justify="end">
					<Button variant="outline" tone="neutral" size="compact" onClick={ showNext }>
						{ __( 'Next flagged line', 'jetpack-protect-pkg' ) }
						<Icon icon={ arrowDown } size={ 20 } />
					</Button>
				</Stack>
			) }
			<pre ref={ code } className="jp-protect-threat-details__code jp-protect-threat-file">
				{ lines.map( ( text, index ) => {
					const run = runs.findIndex( ( [ start ] ) => start === index );
					return (
						<span
							key={ index }
							data-run={ run >= 0 ? run : undefined }
							className={
								isFlagged( index )
									? 'jp-protect-threat-details__line is-flagged'
									: 'jp-protect-threat-details__line'
							}
						>
							<span className="jp-protect-threat-details__line-number">{ index + 1 }</span>
							{ text }
						</span>
					);
				} ) }
			</pre>
		</Stack>
	);
}

/**
 * The file, as the row action's modal, which draws its own header so the title can follow loading.
 *
 * @param props            - DataViews modal props.
 * @param props.items      - The threat, as a one-item list.
 * @param props.closeModal - Closes the modal.
 * @return The file.
 */
export function ThreatFileModal( { items, closeModal }: RenderModalProps< ScanThreat > ) {
	const [ threat ] = items;
	const state = useThreatFile( threat );
	return (
		<Stack direction="column" gap="lg">
			<Stack direction="row" gap="sm" align="center" justify="space-between">
				<Text variant="heading-lg" render={ <h1 className="jp-protect-threat-file__title" /> }>
					{ getThreatFileTitle( threat, ! state.file && ! state.error ) }
				</Text>
				<IconButton
					icon={ close }
					label={ __( 'Close', 'jetpack-protect-pkg' ) }
					variant="minimal"
					tone="neutral"
					onClick={ closeModal }
				/>
			</Stack>
			<ThreatFileBody threat={ threat } { ...state } />
		</Stack>
	);
}

/**
 * The dialog's header and file; mounted only while the dialog is open, so it fetches on open.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @return The dialog's contents.
 */
function ThreatFileDialogContents( { threat }: { threat: ScanThreat } ) {
	const state = useThreatFile( threat );
	return (
		<>
			<Dialog.Header>
				<Dialog.Title>{ getThreatFileTitle( threat, ! state.file && ! state.error ) }</Dialog.Title>
				<Dialog.CloseIconButton />
			</Dialog.Header>
			<Dialog.Content>
				<ThreatFileBody threat={ threat } { ...state } />
			</Dialog.Content>
		</>
	);
}

/**
 * A link that opens the file in a dialog, for the inspector.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @return The link.
 */
export function ThreatFileLink( { threat }: { threat: ScanThreat } ) {
	return (
		<Dialog.Root>
			<Dialog.Trigger
				render={ <Button variant="unstyled" className="jp-protect-card__link-button" /> }
			>
				{ __( 'View file', 'jetpack-protect-pkg' ) }
			</Dialog.Trigger>
			<Dialog.Popup size="large">
				<ThreatFileDialogContents threat={ threat } />
			</Dialog.Popup>
		</Dialog.Root>
	);
}
