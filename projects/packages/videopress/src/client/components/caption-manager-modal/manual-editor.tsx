/**
 * External dependencies
 */
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { Button, TextareaControl } from '@wordpress/components';
import { useFocusOnMount, useViewportMatch } from '@wordpress/compose';
import { useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import {
	CAPTION_CUE_BLOCK_NAME,
	captionBlocksToCues,
	parseTimestampToSeconds,
} from '../../lib/video-tracks/cues';
import { useCaptionEditorContext } from './caption-editor-context';
import CaptionPreviewPlayer from './caption-preview-player';
import LanguageControl from './language-control';
import { createCueAtPlayhead, isFormFieldTarget } from './track-helpers';
import { hasUnsavedTrackEdits } from './workspace-reducer';
/**
 * Types
 */
import type {
	CaptionPreviewPlayerHandle,
	CaptionPreviewProps,
	CueRange,
} from './caption-preview-player';
import type { CaptionCueBlock } from './track-helpers';
import type { ManualWorkspace as ManualWorkspaceState } from './workspace-reducer';
import type { KeyboardEvent, MutableRefObject, ReactElement, RefObject } from 'react';

const PREVIEW_SEEK_STEP_SECONDS = 5;
/* Edits closer together than this merge into one undo level, so a burst of typing undoes as a unit. */
const UNDO_COALESCE_MS = 1000;
const MAX_UNDO_LEVELS = 100;

/*
 * Module constant so the BlockEditorProvider doesn't reset all editor settings
 * into its store on every keystroke (a fresh literal would), which dropped keys.
 */
const CUE_EDITOR_SETTINGS = {
	allowedBlockTypes: [ CAPTION_CUE_BLOCK_NAME ],
	hasFixedToolbar: false,
	canLockBlocks: false,
	bodyPlaceholder: __( 'Add a subtitle cue.', 'jetpack-videopress-pkg' ),
};

type ManualEditorProps = {
	workspace: ManualWorkspaceState;
	playerRef: RefObject< CaptionPreviewPlayerHandle >;
	/** Mirror of the editor's live cue blocks, for the modal's action-time reads. */
	cueBlocksRef: MutableRefObject< CaptionCueBlock[] >;
	/** Video props for the preview player. */
	preview: CaptionPreviewProps;
	/** Languages that already have a track, left out of the language picker. */
	excludedLanguages: string[];
	onLanguageChange: ( tag: string, displayName: string ) => void;
	/** Called when the editor gains or loses unsaved track edits. */
	onDirtyChange: ( isDirty: boolean ) => void;
	onTextImportOpenChange: ( isOpen: boolean ) => void;
	onTextImportValueChange: ( value: string ) => void;
	/** Import the pasted text; returns whether cues were created. */
	onImportText: ( mode: 'append' | 'replace' ) => boolean;
};

/**
 * The manual subtitle editor: language picker, the cue block editor (or the
 * paste-text import panel), keyboard shortcuts, and the video preview.
 *
 * @param props                         - Component props.
 * @param props.workspace               - Manual workspace state.
 * @param props.playerRef               - Imperative preview player handle.
 * @param props.cueBlocksRef            - Mirror of the live cue blocks for the modal.
 * @param props.preview                 - Video props for the preview player.
 * @param props.excludedLanguages       - Languages left out of the language picker.
 * @param props.onLanguageChange        - Called with the selected language tag and display name.
 * @param props.onDirtyChange           - Called when the editor gains or loses unsaved track edits.
 * @param props.onTextImportOpenChange  - Toggle the paste-text panel.
 * @param props.onTextImportValueChange - Called with the pasted text.
 * @param props.onImportText            - Import the pasted text.
 * @return The manual editor workspace.
 */
export default function ManualEditor( {
	workspace,
	playerRef,
	cueBlocksRef,
	preview,
	excludedLanguages,
	onLanguageChange,
	onDirtyChange,
	onTextImportOpenChange,
	onTextImportValueChange,
	onImportText,
}: ManualEditorProps ): ReactElement {
	const { pendingFocusClientIdRef } = useCaptionEditorContext();
	/*
	 * Focus the workspace container (not a header button or the language field)
	 * on mount, so entering the editor never grabs the close button, and the
	 * keyboard shortcuts work right away.
	 */
	const focusOnMountRef = useFocusOnMount( true );
	// The video preview is dropped below the modal's mobile breakpoint: it doesn't
	// fit alongside cue editing on a phone, so skip mounting the player entirely
	// (no VideoPress iframe/video load) rather than just hiding it with CSS.
	const isCompact = useViewportMatch( 'large', '<' );
	const cueEditorRef = useRef< HTMLDivElement >( null );
	const shouldScrollCueEditorToEndRef = useRef( false );

	/*
	 * The live cue blocks are editor-local state, so typing re-renders only this
	 * subtree rather than the whole modal. The modal reads them back through
	 * `cueBlocksRef` at action time (save, publish, dirty check) and re-seeds by
	 * dispatching a new `workspace.cueBlocks` array (async content load, text
	 * import). The render-phase sync keeps the ref current before any handler
	 * can run, which an effect-based sync wouldn't.
	 */
	const [ cueBlocks, setCueBlocks ] = useState( workspace.cueBlocks );
	const seededCueBlocksRef = useRef( workspace.cueBlocks );

	/*
	 * The isolated BlockEditorProvider carries no history of its own, so the
	 * editor keeps its own undo/redo stacks of block snapshots. The arrays only
	 * hold references, so levels are cheap.
	 */
	const undoStackRef = useRef< CaptionCueBlock[][] >( [] );
	const redoStackRef = useRef< CaptionCueBlock[][] >( [] );
	const lastEditTimeRef = useRef( 0 );

	const pushUndoSnapshot = useCallback( ( blocks: CaptionCueBlock[] ) => {
		const now = Date.now();
		if ( ! undoStackRef.current.length || now - lastEditTimeRef.current > UNDO_COALESCE_MS ) {
			undoStackRef.current.push( blocks );
			if ( undoStackRef.current.length > MAX_UNDO_LEVELS ) {
				undoStackRef.current.shift();
			}
		}
		lastEditTimeRef.current = now;
		redoStackRef.current = [];
	}, [] );

	if ( seededCueBlocksRef.current !== workspace.cueBlocks ) {
		seededCueBlocksRef.current = workspace.cueBlocks;
		// A re-seed (async load, text import) replaces every cue; keep it undoable.
		undoStackRef.current.push( cueBlocks );
		if ( undoStackRef.current.length > MAX_UNDO_LEVELS ) {
			undoStackRef.current.shift();
		}
		redoStackRef.current = [];
		lastEditTimeRef.current = 0;
		setCueBlocks( workspace.cueBlocks );
	}
	cueBlocksRef.current = cueBlocks;

	const applyCueBlocksChange = useCallback(
		( blocks: CaptionCueBlock[] ) => {
			pushUndoSnapshot( cueBlocksRef.current );
			setCueBlocks( blocks );
		},
		[ cueBlocksRef, pushUndoSnapshot ]
	);

	const handleCueBlocksChange = useCallback(
		( blocks: unknown ) => applyCueBlocksChange( blocks as CaptionCueBlock[] ),
		[ applyCueBlocksChange ]
	);

	const undo = useCallback( () => {
		const previousBlocks = undoStackRef.current.pop();
		if ( ! previousBlocks ) {
			return;
		}

		redoStackRef.current.push( cueBlocksRef.current );
		lastEditTimeRef.current = 0;
		setCueBlocks( previousBlocks );
	}, [ cueBlocksRef ] );

	const redo = useCallback( () => {
		const nextBlocks = redoStackRef.current.pop();
		if ( ! nextBlocks ) {
			return;
		}

		undoStackRef.current.push( cueBlocksRef.current );
		lastEditTimeRef.current = 0;
		setCueBlocks( nextBlocks );
	}, [ cueBlocksRef ] );

	// Whether the editor holds any complete cues, for the import actions.
	/*
	 * Report dirty-state transitions (not every keystroke) so the modal can
	 * gate its Save draft button without re-rendering per edit.
	 */
	const isDirty = hasUnsavedTrackEdits( workspace, cueBlocks );
	useEffect( () => {
		onDirtyChange( isDirty );
	}, [ isDirty, onDirtyChange ] );

	const cues = useMemo( () => captionBlocksToCues( cueBlocks ), [ cueBlocks ] );
	const hasCues = cues.length > 0;

	// Pre-parsed cue ranges, so the player's per-timeupdate lookups compare numbers.
	const cueRanges = useMemo< CueRange[] >(
		() =>
			cues.map( cue => ( {
				start: parseTimestampToSeconds( cue.startTime ),
				end: parseTimestampToSeconds( cue.endTime ),
				text: cue.text,
			} ) ),
		[ cues ]
	);

	// Sorted cue start times, for the next/previous-cue shortcuts.
	const cueStartTimes = useMemo(
		() =>
			cueRanges
				.map( ( { start } ) => start )
				.filter( ( start ): start is number => start !== null )
				.sort( ( a, b ) => a - b ),
		[ cueRanges ]
	);

	useEffect( () => {
		if ( ! shouldScrollCueEditorToEndRef.current ) {
			return;
		}

		shouldScrollCueEditorToEndRef.current = false;
		if ( cueEditorRef.current?.scrollTo ) {
			cueEditorRef.current.scrollTo( {
				top: cueEditorRef.current.scrollHeight,
				behavior: 'smooth',
			} );
		} else if ( cueEditorRef.current ) {
			cueEditorRef.current.scrollTop = cueEditorRef.current.scrollHeight;
		}
	}, [ cueBlocks ] );

	const addCue = useCallback( () => {
		shouldScrollCueEditorToEndRef.current = true;
		const currentBlocks = cueBlocksRef.current;
		/*
		 * With no mounted player (mobile), fall back to the last cue's end time so
		 * appended cues follow on from each other instead of stacking at zero.
		 */
		const lastCue = currentBlocks[ currentBlocks.length - 1 ];
		const fallbackStart = lastCue
			? parseTimestampToSeconds( String( lastCue.attributes?.endTime ?? '' ) ) ?? 0
			: 0;
		const block = createCueAtPlayhead( playerRef.current?.getCurrentTime() ?? fallbackStart );
		pendingFocusClientIdRef.current = block.clientId;
		applyCueBlocksChange( [ ...currentBlocks, block ] );
	}, [ applyCueBlocksChange, cueBlocksRef, pendingFocusClientIdRef, playerRef ] );

	const seekToAdjacentCue = useCallback(
		( direction: 'next' | 'previous' ) => {
			if ( ! cueStartTimes.length ) {
				return;
			}

			const baseTime = playerRef.current?.getCurrentTime() ?? 0;
			const nextTime =
				direction === 'next'
					? cueStartTimes.find( startTime => startTime > baseTime + 0.01 )
					: [ ...cueStartTimes ].reverse().find( startTime => startTime < baseTime - 0.01 );

			if ( nextTime !== undefined ) {
				playerRef.current?.seekTo( nextTime );
			}
		},
		[ cueStartTimes, playerRef ]
	);

	const handleKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			/*
			 * Undo/redo works from anywhere in the cue editor, including its text
			 * fields (which are controlled, so there is no native undo to defer
			 * to) — but not from the paste-text panel, which edits no cues.
			 */
			if (
				( event.metaKey || event.ctrlKey ) &&
				! event.altKey &&
				event.key.toLowerCase() === 'z' &&
				! workspace.isTextImportOpen
			) {
				event.preventDefault();
				if ( event.shiftKey ) {
					redo();
				} else {
					undo();
				}
				return;
			}

			if ( event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ) {
				return;
			}

			if ( isFormFieldTarget( event.target ) ) {
				return;
			}

			switch ( event.key.toLowerCase() ) {
				case ' ':
					event.preventDefault();
					playerRef.current?.togglePlayback();
					break;
				case 'arrowleft':
					event.preventDefault();
					playerRef.current?.seekBy( -PREVIEW_SEEK_STEP_SECONDS );
					break;
				case 'arrowright':
					event.preventDefault();
					playerRef.current?.seekBy( PREVIEW_SEEK_STEP_SECONDS );
					break;
				case 'c':
					event.preventDefault();
					addCue();
					break;
				case 'n':
					event.preventDefault();
					seekToAdjacentCue( 'next' );
					break;
				case 'p':
					event.preventDefault();
					seekToAdjacentCue( 'previous' );
					break;
			}
		},
		[ addCue, playerRef, redo, seekToAdjacentCue, undo, workspace.isTextImportOpen ]
	);

	const importText = ( mode: 'append' | 'replace' ) => {
		shouldScrollCueEditorToEndRef.current = onImportText( mode ) && mode === 'append';
	};

	return (
		/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Captures keyboard shortcuts for the focused subtitle editing workspace. */
		<div
			className="videopress-caption-manager__editor-body videopress-caption-manager__editor-body--manual videopress-caption-manager__manual-panel"
			role="group"
			aria-label={ __( 'Subtitle editing workspace', 'jetpack-videopress-pkg' ) }
			aria-keyshortcuts="Space ArrowLeft ArrowRight C N P Control+Z Control+Shift+Z"
			aria-describedby="videopress-caption-manager-shortcuts"
			tabIndex={ 0 }
			onKeyDown={ handleKeyDown }
			ref={ focusOnMountRef }
		>
			<p
				id="videopress-caption-manager-shortcuts"
				className="videopress-caption-manager__visually-hidden"
			>
				{ __(
					'Keyboard shortcuts: Space plays or pauses the preview, the Left and Right arrow keys seek, C adds a subtitle at the playhead, N and P jump to the next or previous subtitle, and Control+Z or Command+Z undoes an edit (add Shift to redo).',
					'jetpack-videopress-pkg'
				) }
			</p>
			<div
				className="videopress-caption-manager__manual-main"
				onInput={ () => playerRef.current?.pauseWhileTypingNow() }
			>
				<div className="videopress-caption-manager__manual-meta">
					<LanguageControl
						label={ __( 'Language', 'jetpack-videopress-pkg' ) }
						value={ workspace.track.srcLang }
						onChange={ onLanguageChange }
						excludedLanguages={ excludedLanguages }
					/>
				</div>

				{ workspace.isTextImportOpen ? (
					<div className="videopress-caption-manager__text-import">
						<TextareaControl
							label={ __( 'Subtitle text', 'jetpack-videopress-pkg' ) }
							help={ __(
								'Paste timed captions to keep their timings, or plain text to create evenly spaced cues.',
								'jetpack-videopress-pkg'
							) }
							value={ workspace.textImportValue }
							onChange={ onTextImportValueChange }
							rows={ 10 }
							__nextHasNoMarginBottom={ true }
						/>
						<div className="videopress-caption-manager__text-import-actions">
							<Button variant="secondary" onClick={ () => onTextImportOpenChange( false ) }>
								{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
							</Button>
							{ hasCues && (
								<Button
									variant="secondary"
									onClick={ () => importText( 'append' ) }
									disabled={ ! workspace.textImportValue.trim() }
								>
									{ __( 'Append', 'jetpack-videopress-pkg' ) }
								</Button>
							) }
							<Button
								variant="primary"
								onClick={ () => importText( 'replace' ) }
								disabled={ ! workspace.textImportValue.trim() }
							>
								{ /* The context also keeps the branches distinct so minification can't merge the two calls, which would break string extraction. */ }
								{ hasCues
									? _x(
											'Replace',
											'button: replace the existing subtitle cues with the pasted text',
											'jetpack-videopress-pkg'
									  )
									: __( 'Create cues', 'jetpack-videopress-pkg' ) }
							</Button>
						</div>
					</div>
				) : (
					<div className="videopress-caption-manager__cue-editor" ref={ cueEditorRef }>
						<BlockEditorProvider
							value={ cueBlocks }
							onInput={ handleCueBlocksChange }
							onChange={ handleCueBlocksChange }
							settings={ CUE_EDITOR_SETTINGS }
						>
							<BlockList />
						</BlockEditorProvider>
						{ ! cueBlocks.length && (
							<div className="videopress-caption-manager__cue-empty">
								<Button variant="secondary" icon={ plus } onClick={ addCue }>
									{ __( 'Add subtitle', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button variant="secondary" onClick={ () => onTextImportOpenChange( true ) }>
									{ __( 'Paste text', 'jetpack-videopress-pkg' ) }
								</Button>
							</div>
						) }
						{ /* Touch devices have no hover to reveal the between-cue insert buttons
						     and no keyboard shortcut, so offer a persistent way to append a cue. */ }
						{ isCompact && !! cueBlocks.length && (
							<div className="videopress-caption-manager__cue-add">
								<Button variant="secondary" icon={ plus } onClick={ addCue }>
									{ __( 'Add subtitle', 'jetpack-videopress-pkg' ) }
								</Button>
							</div>
						) }
					</div>
				) }
			</div>

			{ ! isCompact && (
				<CaptionPreviewPlayer ref={ playerRef } { ...preview } cueRanges={ cueRanges } />
			) }
		</div>
	);
}
