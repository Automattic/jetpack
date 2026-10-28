import apiFetch from '@wordpress/api-fetch';
import { useCopyToClipboard } from '@wordpress/compose';
import { dispatch } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { arrowDown, check, copySmall } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import {
	AlertDialog,
	Button,
	Dialog,
	Icon,
	Notice,
	Spinner,
	Stack,
	Text,
	Tooltip,
} from '@wordpress/ui';
import { loadHistory } from '../history/store';
import SeverityBadge from './severity-badge';
import { SCAN_PATH, THREAT_PARAM, createStore, editScan, useSearchParam } from './store';
import { fixThreat, ignoreThreat, unignoreThreat, useThreatAction } from './threat-actions';
import type { ScanThreat } from './types';

const COPIED_DURATION = 15000;

// Lines kept around each flagged run when the rest of a long file is folded away.
const FOLD_CONTEXT = 10;
const FOLD_MIN_LINES = 60;

type FileOwner =
	| { type: 'plugin' | 'theme'; name: string; version: string }
	| { type: 'core'; version: string; modified: boolean }
	| { type: 'mu-plugin' | 'none' };

type ThreatFile = {
	path: string;
	modified: string | null;
	owner: FileOwner;
	inUploads: boolean;
	canDelete: boolean;
	canRestore: boolean;
	contents: string;
};

/** A flagged stretch of the file, as first and last line indexes. */
type Run = [ number, number ];

/** Lines to show, or lines folded behind a button, as first and last indexes. */
export type Segment = { folded: boolean; start: number; end: number };

/**
 * The name of the file a threat is in, such as "index.php".
 *
 * @param threat - The threat.
 * @return The name.
 */
export const getThreatFileName = ( threat: ScanThreat ) =>
	threat.filename?.split( '/' ).pop() ?? '';

/**
 * The viewer's title: "Opening… index.php" while it loads, then "Open: index.php".
 *
 * @param threat    - The threat.
 * @param isLoading - Whether the file is still loading.
 * @return The title.
 */
export const getThreatFileTitle = ( threat: ScanThreat, isLoading = false ) =>
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
 * Split a long file into the lines around each flagged run and the folds between them.
 *
 * @param count    - How many lines the file has.
 * @param runs     - The flagged runs.
 * @param expanded - Starts of folds the user opened.
 * @return The segments, in file order.
 */
export function getSegments( count: number, runs: Run[], expanded: Set< number > ): Segment[] {
	if ( count < FOLD_MIN_LINES || ! runs.length ) {
		return [ { folded: false, start: 0, end: count - 1 } ];
	}
	const shown = runs.map( ( [ start, end ] ): Run => [
		Math.max( 0, start - FOLD_CONTEXT ),
		Math.min( count - 1, end + FOLD_CONTEXT ),
	] );
	const segments: Segment[] = [];
	let next = 0;
	const add = ( start: number, end: number, isGap = false ) => {
		// A fold hiding only a few lines saves nothing, and an opened one stays open.
		const folded = isGap && end - start >= 3 && ! expanded.has( start );
		const last = segments[ segments.length - 1 ];
		if ( ! folded && last && ! last.folded ) {
			last.end = end;
		} else {
			segments.push( { folded, start, end } );
		}
	};
	for ( const [ start, end ] of shown ) {
		if ( end < next ) {
			continue;
		}
		if ( start > next ) {
			add( next, start - 1, true );
		}
		add( Math.max( start, next ), end );
		next = end + 1;
	}
	if ( next < count ) {
		add( next, count - 1, true );
	}
	return segments;
}

/**
 * Lines holding a long encoded string, a common way to hide malicious code.
 *
 * @param lines - The file's lines.
 * @return Their indexes.
 */
export function getEncodedLines( lines: string[] ): number[] {
	return lines.reduce< number[] >(
		( found, line, index ) =>
			/[A-Za-z0-9+/]{200,}={0,2}|(?:\\x[0-9a-f]{2}){20,}/i.test( line )
				? [ ...found, index ]
				: found,
		[]
	);
}

/**
 * What the file belongs to, as a sentence.
 *
 * @param owner - The file's owner.
 * @return The sentence.
 */
function describeOwner( owner: FileOwner ): string {
	switch ( owner.type ) {
		case 'plugin':
			return sprintf(
				/* translators: 1: a plugin name, such as "Contact Form 7". 2: its version. */
				__( 'Part of the %1$s plugin (%2$s).', 'jetpack-protect-pkg' ),
				owner.name,
				owner.version
			);
		case 'theme':
			return sprintf(
				/* translators: 1: a theme name, such as "Twenty Twenty". 2: its version. */
				__( 'Part of the %1$s theme (%2$s).', 'jetpack-protect-pkg' ),
				owner.name,
				owner.version
			);
		case 'mu-plugin':
			return __( 'A must-use plugin, which WordPress always runs.', 'jetpack-protect-pkg' );
		case 'core':
			return owner.modified
				? sprintf(
						/* translators: %s is a WordPress version, such as "6.8". */
						__(
							'A WordPress %s core file, changed from the original on WordPress.org.',
							'jetpack-protect-pkg'
						),
						owner.version
					)
				: sprintf(
						/* translators: %s is a WordPress version, such as "6.8". */
						__(
							'A WordPress %s core file, unchanged from the original on WordPress.org.',
							'jetpack-protect-pkg'
						),
						owner.version
					);
		default:
			return __(
				'This file doesn’t belong to WordPress, a plugin or a theme.',
				'jetpack-protect-pkg'
			);
	}
}

/**
 * An icon button that copies text, with its label as a tooltip that shows at once and says "Copied" for a while after.
 *
 * @param props       - Component props.
 * @param props.text  - The text to copy.
 * @param props.label - What the button copies, such as "Copy file path".
 * @return The button.
 */
function CopyButton( { text, label }: { text: string; label: string } ) {
	const [ copied, setCopied ] = useState( false );
	const timer = useRef< ReturnType< typeof setTimeout > >( undefined );
	const ref = useCopyToClipboard< HTMLButtonElement >( text, () => {
		setCopied( true );
		clearTimeout( timer.current );
		timer.current = setTimeout( () => setCopied( false ), COPIED_DURATION );
	} );
	useEffect( () => () => clearTimeout( timer.current ), [] );
	const shown = copied ? __( 'Copied', 'jetpack-protect-pkg' ) : label;

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				delay={ 0 }
				closeOnClick={ false }
				render={
					<Button
						ref={ ref }
						className="jp-protect-threat-file__copy"
						variant="minimal"
						tone="neutral"
						size="small"
						aria-label={ shown }
					/>
				}
			>
				<Icon icon={ copied ? check : copySmall } size={ 24 } />
			</Tooltip.Trigger>
			<Tooltip.Popup>{ shown }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

/**
 * The threat, when the file changed, where it is, and what it belongs to.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @param props.file   - The file.
 * @return The header.
 */
function FileMeta( { threat, file }: { threat: ScanThreat; file: ThreatFile } ) {
	return (
		<Stack direction="column" gap="xs">
			<Stack direction="row" gap="sm" align="center" wrap="wrap">
				<SeverityBadge severity={ threat.severity } />
				{ threat.title && <Text variant="body-md">{ threat.title }</Text> }
			</Stack>
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
				<CopyButton text={ file.path } label={ __( 'Copy file path', 'jetpack-protect-pkg' ) } />
			</Stack>
			<Text variant="body-sm">{ describeOwner( file.owner ) }</Text>
			{ file.inUploads && (
				<Text variant="body-sm" className="jp-protect-threat-file__warning">
					{ __(
						'Code doesn’t belong in the uploads folder. WordPress never puts any there.',
						'jetpack-protect-pkg'
					) }
				</Text>
			) }
		</Stack>
	);
}

type ThreatFileState = { file: ThreatFile | null; error: string | null; reload: () => void };

/**
 * Fetch the file a threat was found in.
 *
 * @param threat - The threat.
 * @return The file once loaded, or why it couldn't be, and a way to load it again.
 */
function useThreatFile( threat: ScanThreat ): ThreatFileState {
	const { id } = threat;
	const [ state, setState ] = useState< Omit< ThreatFileState, 'reload' > >( {
		file: null,
		error: null,
	} );
	const [ version, setVersion ] = useState( 0 );
	// By id: scan polling replaces the threat object, which would refetch the whole file.
	useEffect( () => {
		let current = true;
		apiFetch< ThreatFile >( { path: `${ SCAN_PATH }/threats/${ id }/file` } )
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
	}, [ id, version ] );
	const reload = useCallback( () => setVersion( value => value + 1 ), [] );
	return { ...state, reload };
}

/**
 * Run a file action, resolving to `{ error }` when it failed, as AlertDialog's onConfirm takes.
 *
 * @param threat  - The threat.
 * @param action  - `delete` or `restore`.
 * @param message - The snackbar once done.
 * @return The result.
 */
async function runFileAction( threat: ScanThreat, action: 'delete' | 'restore', message: string ) {
	try {
		await apiFetch( {
			path: `${ SCAN_PATH }/threats/${ threat.id }/file/${ action }`,
			method: 'POST',
		} );
		const isOther = ( item: ScanThreat ) => item.id !== threat.id;
		editScan( current => ( {
			...current,
			threats: ( current.threats ?? [] ).filter( isOther ),
			ignored: current.ignored?.filter( isOther ),
		} ) );
		loadHistory( true );
	} catch ( e ) {
		return {
			error:
				( e as { message?: string } )?.message ||
				__( 'That didn’t work. Try again in a few minutes.', 'jetpack-protect-pkg' ),
		};
	}
	dispatch( noticesStore ).createNotice( 'success', message, { type: 'snackbar' } );
	return undefined;
}

/**
 * What can be done about the threat from the viewer, pinned to its bottom.
 *
 * @param props         - Component props.
 * @param props.threat  - The threat.
 * @param props.file    - The file.
 * @param props.onClose - Closes the viewer.
 * @param props.reload  - Loads the file again.
 * @return The actions.
 */
function FileActions( {
	threat,
	file,
	onClose,
	reload,
}: {
	threat: ScanThreat;
	file: ThreatFile;
	onClose: () => void;
	reload: () => void;
} ) {
	const { busy } = useThreatAction( threat.id );
	const [ selected, setSelected ] = useSearchParam( THREAT_PARAM );
	const name = getThreatFileName( threat );
	// The threat leaves the lists once its file is dealt with, so the inspector can't show it.
	const closeInspector = useCallback( () => {
		if ( selected === String( threat.id ) ) {
			setSelected();
		}
	}, [ selected, threat, setSelected ] );
	const isIgnored = threat.status === 'ignored';

	const onIgnore = useCallback( () => {
		( isIgnored ? unignoreThreat : ignoreThreat )( threat );
		onClose();
	}, [ isIgnored, threat, onClose ] );
	const onFix = useCallback( () => {
		fixThreat( threat );
		onClose();
	}, [ threat, onClose ] );
	const onDelete = useCallback( async () => {
		const result = await runFileAction(
			threat,
			'delete',
			sprintf(
				/* translators: %s is a file name, such as "index.php". */
				__( 'Deleted %s and marked the threat fixed.', 'jetpack-protect-pkg' ),
				name
			)
		);
		if ( ! result ) {
			closeInspector();
			onClose();
		}
		return result;
	}, [ threat, name, onClose, closeInspector ] );
	const onRestore = useCallback( async () => {
		const result = await runFileAction(
			threat,
			'restore',
			sprintf(
				/* translators: %s is a file name, such as "index.php". */
				__( 'Restored the original %s and marked the threat fixed.', 'jetpack-protect-pkg' ),
				name
			)
		);
		if ( ! result ) {
			closeInspector();
			reload();
		}
		return result;
	}, [ threat, name, reload, closeInspector ] );

	return (
		<Stack
			className="jp-protect-threat-file__actions"
			direction="row"
			gap="sm"
			justify="end"
			wrap="wrap"
		>
			<Button variant="minimal" tone="neutral" onClick={ onIgnore } disabled={ !! busy }>
				{ isIgnored
					? __( 'Unignore it', 'jetpack-protect-pkg' )
					: __( 'Ignore it', 'jetpack-protect-pkg' ) }
			</Button>
			{ file.canRestore && (
				<AlertDialog.Root onConfirm={ onRestore }>
					<AlertDialog.Trigger render={ <Button variant="outline" disabled={ !! busy } /> }>
						{ __( 'Restore original', 'jetpack-protect-pkg' ) }
					</AlertDialog.Trigger>
					<AlertDialog.Popup
						title={ __( 'Restore the original file?', 'jetpack-protect-pkg' ) }
						description={ __(
							'Jetpack replaces this file with the copy WordPress.org ships for your version of WordPress. Any changes made to it are lost.',
							'jetpack-protect-pkg'
						) }
						confirmButtonText={ __( 'Restore original', 'jetpack-protect-pkg' ) }
					/>
				</AlertDialog.Root>
			) }
			{ file.canDelete && (
				<AlertDialog.Root onConfirm={ onDelete }>
					<AlertDialog.Trigger
						render={ <Button variant="outline" tone="neutral" disabled={ !! busy } /> }
					>
						{ __( 'Delete file', 'jetpack-protect-pkg' ) }
					</AlertDialog.Trigger>
					<AlertDialog.Popup
						intent="irreversible"
						title={ __( 'Delete this file?', 'jetpack-protect-pkg' ) }
						description={ sprintf(
							/* translators: %s is a file path, such as "wp-content/uploads/evil.php". */
							__(
								'%s doesn’t belong to WordPress, a plugin or a theme, so your site doesn’t need it. Deleting it can’t be undone.',
								'jetpack-protect-pkg'
							),
							file.path
						) }
						confirmButtonText={ __( 'Delete file', 'jetpack-protect-pkg' ) }
					/>
				</AlertDialog.Root>
			) }
			{ threat.fixable && ! isIgnored && (
				<Button onClick={ onFix } disabled={ !! busy }>
					{ __( 'Auto-fix it', 'jetpack-protect-pkg' ) }
				</Button>
			) }
		</Stack>
	);
}

/**
 * A button standing in for folded lines, which shows them.
 *
 * @param props          - Component props.
 * @param props.start    - The first folded line's index.
 * @param props.end      - The last folded line's index.
 * @param props.onExpand - Shows the lines, given the fold's start.
 * @return The button.
 */
function FoldButton( {
	start,
	end,
	onExpand,
}: {
	start: number;
	end: number;
	onExpand: ( start: number ) => void;
} ) {
	const onClick = useCallback( () => onExpand( start ), [ onExpand, start ] );
	const count = end - start + 1;
	return (
		<Button variant="unstyled" className="jp-protect-threat-file__fold" onClick={ onClick }>
			{ sprintf(
				/* translators: %d is how many lines are hidden. */
				_n( 'Show %d more line', 'Show %d more lines', count, 'jetpack-protect-pkg' ),
				count
			) }
		</Button>
	);
}

/**
 * The whole file a threat was found in, with Scan's flagged lines highlighted.
 *
 * @param props         - Component props.
 * @param props.threat  - The threat.
 * @param props.file    - The file, once loaded.
 * @param props.error   - Why it couldn't be loaded.
 * @param props.reload  - Loads the file again.
 * @param props.onClose - Closes the viewer.
 * @return The file.
 */
function ThreatFileBody( {
	threat,
	file,
	error,
	reload,
	onClose,
}: ThreatFileState & { threat: ScanThreat; onClose: () => void } ) {
	const [ shown, setShown ] = useState( 0 );
	const [ wrap, setWrap ] = useState( false );
	const [ expanded, setExpanded ] = useState< Set< number > >( () => new Set() );
	const code = useRef< HTMLPreElement >( null );

	const lines = useMemo( () => file?.contents.split( /\r?\n/ ) ?? [], [ file ] );
	const runs = useMemo( () => getFlaggedRuns( lines, threat.context ), [ lines, threat.context ] );
	const encoded = useMemo( () => getEncodedLines( lines ), [ lines ] );

	const expand = useCallback(
		( start: number ) => setExpanded( open => new Set( open ).add( start ) ),
		[]
	);

	// Memoized so moving between flagged runs only scrolls, without re-rendering every line.
	const rendered = useMemo( () => {
		const flagged = new Set< number >();
		const runAt = new Map< number, number >();
		runs.forEach( ( [ start, end ], run ) => {
			runAt.set( start, run );
			for ( let index = start; index <= end; index++ ) {
				flagged.add( index );
			}
		} );
		const line = ( index: number ) => (
			<span
				key={ index }
				data-run={ runAt.get( index ) }
				className={
					flagged.has( index )
						? 'jp-protect-threat-details__line is-flagged'
						: 'jp-protect-threat-details__line'
				}
			>
				<span className="jp-protect-threat-details__line-number">{ index + 1 }</span>
				<span className="jp-protect-threat-file__text">{ lines[ index ] }</span>
			</span>
		);
		return getSegments( lines.length, runs, expanded ).flatMap( ( { folded, start, end } ) =>
			folded
				? [
						<FoldButton
							key={ `fold-${ start }` }
							start={ start }
							end={ end }
							onExpand={ expand }
						/>,
					]
				: Array.from( { length: end - start + 1 }, ( _, offset ) => line( start + offset ) )
		);
	}, [ lines, runs, expanded, expand ] );

	// Scrolls the code alone, so the dialog keeps its header in view.
	useEffect( () => {
		const pre = code.current;
		const target = pre?.querySelector< HTMLElement >( `[data-run="${ shown }"]` );
		if ( pre && target ) {
			pre.scrollTo( {
				top: target.offsetTop - ( pre.clientHeight - target.offsetHeight ) / 2,
				behavior: 'smooth',
			} );
		}
	}, [ file, shown ] );

	const showNext = useCallback( () => setShown( index => ( index + 1 ) % runs.length ), [ runs ] );
	const toggleWrap = useCallback( () => setWrap( value => ! value ), [] );

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
			<FileMeta threat={ threat } file={ file } />
			{ threat.context?.length && ! runs.length ? (
				<Text variant="body-md">
					{ __(
						'The flagged code isn’t in this file anymore. It may have changed since the last scan.',
						'jetpack-protect-pkg'
					) }
				</Text>
			) : null }
			{ encoded.length > 0 && (
				<Text variant="body-sm" className="jp-protect-threat-file__warning">
					{ sprintf(
						/* translators: %s is a list of line numbers, such as "12, 40". */
						_n(
							'Line %s holds a long encoded string, a common way to hide malicious code.',
							'Lines %s hold long encoded strings, a common way to hide malicious code.',
							encoded.length,
							'jetpack-protect-pkg'
						),
						encoded
							.slice( 0, 5 )
							.map( index => index + 1 )
							.join( ', ' )
					) }
				</Text>
			) }
			<Stack direction="row" gap="sm" align="center" justify="end">
				<Button
					variant="minimal"
					tone="neutral"
					size="compact"
					aria-pressed={ wrap }
					onClick={ toggleWrap }
				>
					{ __( 'Wrap lines', 'jetpack-protect-pkg' ) }
				</Button>
				{ runs.length > 1 && (
					<Button variant="outline" tone="neutral" size="compact" onClick={ showNext }>
						{ __( 'Next flagged line', 'jetpack-protect-pkg' ) }
						<Icon icon={ arrowDown } size={ 20 } />
					</Button>
				) }
				<CopyButton
					text={ file.contents }
					label={ __( 'Copy file contents', 'jetpack-protect-pkg' ) }
				/>
			</Stack>
			<pre
				ref={ code }
				className={ `jp-protect-threat-details__code jp-protect-threat-file${
					wrap ? ' is-wrapped' : ''
				}` }
			>
				{ rendered }
			</pre>
			<FileActions threat={ threat } file={ file } onClose={ onClose } reload={ reload } />
		</Stack>
	);
}

/**
 * The dialog's header and file; mounted only while the dialog is open, so it fetches on open.
 *
 * @param props         - Component props.
 * @param props.threat  - The threat.
 * @param props.onClose - Closes the dialog.
 * @return The dialog's contents.
 */
function ThreatFileDialogContents( {
	threat,
	onClose,
}: {
	threat: ScanThreat;
	onClose: () => void;
} ) {
	const state = useThreatFile( threat );
	return (
		<>
			<Dialog.Header>
				<Dialog.Title>{ getThreatFileTitle( threat, ! state.file && ! state.error ) }</Dialog.Title>
				<Dialog.CloseIconButton />
			</Dialog.Header>
			<Dialog.Content>
				<ThreatFileBody threat={ threat } onClose={ onClose } { ...state } />
			</Dialog.Content>
		</>
	);
}

const viewerStore = createStore< ScanThreat | null >( () => null );

/**
 * Open a threat's file in the viewer that ThreatFileViewer renders.
 *
 * @param threat - The threat.
 */
export function openThreatFile( threat: ScanThreat ) {
	viewerStore.set( () => threat );
}

/**
 * The viewer the row actions open, mounted once beside each threat list.
 *
 * @return The dialog.
 */
export function ThreatFileViewer() {
	const threat = useSyncExternalStore( viewerStore.subscribe, viewerStore.get );
	const onClose = useCallback( () => viewerStore.set( () => null ), [] );
	const onOpenChange = useCallback( ( open: boolean ) => ! open && onClose(), [ onClose ] );
	return (
		<Dialog.Root open={ !! threat } onOpenChange={ onOpenChange }>
			<Dialog.Popup size="large">
				{ threat && <ThreatFileDialogContents threat={ threat } onClose={ onClose } /> }
			</Dialog.Popup>
		</Dialog.Root>
	);
}

/**
 * A link that opens the file in the viewer, for the inspector.
 *
 * @param props        - Component props.
 * @param props.threat - The threat.
 * @return The link.
 */
export function ThreatFileLink( { threat }: { threat: ScanThreat } ) {
	const onClick = useCallback( () => openThreatFile( threat ), [ threat ] );
	return (
		<Button variant="unstyled" className="jp-protect-card__link-button" onClick={ onClick }>
			{ __( 'View file', 'jetpack-protect-pkg' ) }
		</Button>
	);
}
