/**
 * External dependencies
 */
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { Button, TextareaControl } from '@wordpress/components';
import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { CAPTION_CUE_BLOCK_NAME } from '../../lib/video-tracks/cues';
import { useCaptionEditorContext } from './caption-editor-context';
import LanguageControl from './language-control';
import {
	createCueBlock,
	getDefaultCueEndTime,
	getDefaultCueStartTime,
	isFormFieldTarget,
} from './track-helpers';
/**
 * Types
 */
import type { CaptionPreviewPlayerHandle } from './caption-preview-player';
import type { CaptionCueBlock } from './track-helpers';
import type { ManualWorkspace as ManualWorkspaceState } from './workspace-reducer';
import type { KeyboardEvent, ReactElement, RefObject } from 'react';

const PREVIEW_SEEK_STEP_SECONDS = 5;

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
	previewPanel: ReactElement;
	/** Sorted cue start times, for the next/previous-cue shortcuts. */
	cueStartTimes: number[];
	/** Whether the editor holds any complete cues, for the import actions. */
	hasCues: boolean;
	onLanguageChange: ( tag: string, displayName: string ) => void;
	onCueBlocksChange: ( cueBlocks: CaptionCueBlock[] ) => void;
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
 * @param props.previewPanel            - Preview player element.
 * @param props.cueStartTimes           - Sorted cue start times for cue jumps.
 * @param props.hasCues                 - Whether the editor holds complete cues.
 * @param props.onLanguageChange        - Called with the selected language tag and display name.
 * @param props.onCueBlocksChange       - Called with the edited cue blocks.
 * @param props.onTextImportOpenChange  - Toggle the paste-text panel.
 * @param props.onTextImportValueChange - Called with the pasted text.
 * @param props.onImportText            - Import the pasted text.
 * @return The manual editor workspace.
 */
export default function ManualEditor( {
	workspace,
	playerRef,
	previewPanel,
	cueStartTimes,
	hasCues,
	onLanguageChange,
	onCueBlocksChange,
	onTextImportOpenChange,
	onTextImportValueChange,
	onImportText,
}: ManualEditorProps ): ReactElement {
	const { getCurrentTime, pendingFocusClientIdRef } = useCaptionEditorContext();
	const containerRef = useRef< HTMLDivElement >( null );
	const cueEditorRef = useRef< HTMLDivElement >( null );
	const shouldScrollCueEditorToEndRef = useRef( false );

	/*
	 * Focus the workspace container (not a header button or the language field)
	 * on mount, so entering the editor never grabs the close button, and the
	 * keyboard shortcuts work right away.
	 */
	useEffect( () => {
		containerRef.current?.focus();
	}, [] );

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
	}, [ workspace.cueBlocks ] );

	const addCue = useCallback( () => {
		const currentTime = getCurrentTime();
		shouldScrollCueEditorToEndRef.current = true;
		const block = createCueBlock( {
			startTime: getDefaultCueStartTime( currentTime ),
			endTime: getDefaultCueEndTime( currentTime ),
		} );
		pendingFocusClientIdRef.current = block.clientId;
		onCueBlocksChange( [ ...workspace.cueBlocks, block ] );
	}, [ getCurrentTime, onCueBlocksChange, pendingFocusClientIdRef, workspace.cueBlocks ] );

	const seekToAdjacentCue = useCallback(
		( direction: 'next' | 'previous' ) => {
			if ( ! cueStartTimes.length ) {
				return;
			}

			const baseTime = playerRef.current?.getCurrentTime() ?? getCurrentTime();
			const nextTime =
				direction === 'next'
					? cueStartTimes.find( startTime => startTime > baseTime + 0.01 )
					: [ ...cueStartTimes ].reverse().find( startTime => startTime < baseTime - 0.01 );

			if ( nextTime !== undefined ) {
				playerRef.current?.seekTo( nextTime );
			}
		},
		[ cueStartTimes, getCurrentTime, playerRef ]
	);

	const handleKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
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
		[ addCue, playerRef, seekToAdjacentCue ]
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
			aria-keyshortcuts="Space ArrowLeft ArrowRight C N P"
			aria-describedby="videopress-caption-manager-shortcuts"
			tabIndex={ 0 }
			onKeyDown={ handleKeyDown }
			ref={ containerRef }
		>
			<p
				id="videopress-caption-manager-shortcuts"
				className="videopress-caption-manager__visually-hidden"
			>
				{ __(
					'Keyboard shortcuts: Space plays or pauses the preview, the Left and Right arrow keys seek, C adds a subtitle at the playhead, and N and P jump to the next or previous subtitle.',
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
								{ hasCues
									? __( 'Replace', 'jetpack-videopress-pkg' )
									: __( 'Create cues', 'jetpack-videopress-pkg' ) }
							</Button>
						</div>
					</div>
				) : (
					<div className="videopress-caption-manager__cue-editor" ref={ cueEditorRef }>
						<BlockEditorProvider
							value={ workspace.cueBlocks }
							onInput={ blocks => onCueBlocksChange( blocks as CaptionCueBlock[] ) }
							onChange={ blocks => onCueBlocksChange( blocks as CaptionCueBlock[] ) }
							settings={ CUE_EDITOR_SETTINGS }
						>
							<BlockList />
						</BlockEditorProvider>
						{ ! workspace.cueBlocks.length && (
							<div className="videopress-caption-manager__cue-empty">
								<Button variant="secondary" icon={ plus } onClick={ addCue }>
									{ __( 'Add subtitle', 'jetpack-videopress-pkg' ) }
								</Button>
								<Button variant="secondary" onClick={ () => onTextImportOpenChange( true ) }>
									{ __( 'Paste text', 'jetpack-videopress-pkg' ) }
								</Button>
							</div>
						) }
					</div>
				) }
			</div>

			{ previewPanel }
		</div>
	);
}
