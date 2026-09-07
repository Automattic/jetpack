/**
 * Internal dependencies
 */
import { getCueBlocksSignature } from './track-helpers';
/**
 * Types
 */
import type {
	CaptionCueBlock,
	ManualTrack,
	UploadFormMode,
	UploadFormTrack,
} from './track-helpers';
import type { VideoTextTrack } from '../../lib/video-tracks/types';

/**
 * The modal's workspace is a small state machine: the track list, the file
 * upload form, or the manual cue editor. Each variant owns the state that only
 * exists in that view, so transitions can't leave stale fields behind.
 *
 * `requestId` identifies the workspace instance: async continuations started
 * for one workspace (a track-content load, a publish) carry the id they were
 * started with and are ignored once a newer workspace exists.
 */
export type TracksWorkspace = {
	view: 'tracks';
	requestId: number;
};

export type UploadWorkspace = {
	view: 'upload';
	requestId: number;
	mode: UploadFormMode;
	replacingTrack: VideoTextTrack | null;
	form: UploadFormTrack;
};

export type ManualWorkspace = {
	view: 'manual';
	requestId: number;
	track: ManualTrack;
	sourceTrack: VideoTextTrack | null;
	captionTrackId: number | undefined;
	/*
	 * The cue blocks the editor was last seeded or saved with. The live blocks
	 * are the editor's own state, read back through a ref at action time; a new
	 * array here re-seeds the editor.
	 */
	cueBlocks: CaptionCueBlock[];
	/* Signature of the last loaded/saved cue content, to tell an edit from viewing. */
	cueBaseline: string;
	/* Language/label the editor was seeded with, so changing only those counts as an edit. */
	trackBaseline: Pick< ManualTrack, 'srcLang' | 'label' >;
	isLoadingContent: boolean;
	isTextImportOpen: boolean;
	textImportValue: string;
};

export type WorkspaceState = TracksWorkspace | UploadWorkspace | ManualWorkspace;

export type WorkspaceAction =
	| { type: 'RESET'; requestId: number }
	| {
			type: 'OPEN_UPLOAD';
			requestId: number;
			mode: UploadFormMode;
			replacingTrack: VideoTextTrack | null;
			form: UploadFormTrack;
	  }
	| { type: 'SET_UPLOAD_FILE'; file: File | null }
	| { type: 'SET_UPLOAD_LANGUAGE'; srcLang: string; label: string }
	| {
			type: 'OPEN_MANUAL';
			requestId: number;
			track: ManualTrack;
			sourceTrack: VideoTextTrack | null;
			captionTrackId: number | undefined;
			cueBlocks: CaptionCueBlock[];
			isLoadingContent: boolean;
			isTextImportOpen?: boolean;
	  }
	| { type: 'SET_MANUAL_LANGUAGE'; srcLang: string; label: string }
	| { type: 'SEED_CUE_BLOCKS'; requestId: number; cueBlocks: CaptionCueBlock[] }
	| { type: 'CONTENT_LOAD_FAILED'; requestId: number }
	| {
			type: 'MARK_SAVED';
			requestId: number;
			captionTrackId: number | undefined;
			cueBlocks: CaptionCueBlock[];
	  }
	| { type: 'SET_TEXT_IMPORT_OPEN'; isOpen: boolean }
	| { type: 'SET_TEXT_IMPORT_VALUE'; value: string }
	| {
			type: 'IMPORT_CUES';
			mode: 'append' | 'replace';
			cueBlocks: CaptionCueBlock[];
			currentCueBlocks: CaptionCueBlock[];
	  };

export const initialWorkspaceState: WorkspaceState = { view: 'tracks', requestId: 0 };

const WORKSPACE_CREATING_ACTIONS: ReadonlyArray< WorkspaceAction[ 'type' ] > = [
	'RESET',
	'OPEN_UPLOAD',
	'OPEN_MANUAL',
];

/**
 * Reduce a workspace action into the next workspace state.
 *
 * Actions that only apply to one view are ignored in the others, and actions
 * carrying a `requestId` are ignored when a newer workspace has replaced the
 * one they were started for.
 *
 * @param state  - Current workspace state.
 * @param action - Action to apply.
 * @return The next workspace state.
 */
export function workspaceReducer( state: WorkspaceState, action: WorkspaceAction ): WorkspaceState {
	/*
	 * The generic staleness gate: any non-creating action carrying a requestId
	 * is an async continuation, and is dropped when a newer workspace has
	 * replaced the one it was started for.
	 */
	if (
		! WORKSPACE_CREATING_ACTIONS.includes( action.type ) &&
		'requestId' in action &&
		action.requestId !== state.requestId
	) {
		return state;
	}

	switch ( action.type ) {
		case 'RESET':
			return { view: 'tracks', requestId: action.requestId };

		case 'OPEN_UPLOAD':
			return {
				view: 'upload',
				requestId: action.requestId,
				mode: action.mode,
				replacingTrack: action.replacingTrack,
				form: action.form,
			};

		case 'SET_UPLOAD_FILE':
			if ( state.view !== 'upload' ) {
				return state;
			}
			return { ...state, form: { ...state.form, tmpFile: action.file } };

		case 'SET_UPLOAD_LANGUAGE':
			if ( state.view !== 'upload' ) {
				return state;
			}
			return {
				...state,
				form: { ...state.form, srcLang: action.srcLang, label: action.label },
			};

		case 'OPEN_MANUAL':
			return {
				view: 'manual',
				requestId: action.requestId,
				track: action.track,
				sourceTrack: action.sourceTrack,
				captionTrackId: action.captionTrackId,
				cueBlocks: action.cueBlocks,
				cueBaseline: getCueBlocksSignature( action.cueBlocks ),
				trackBaseline: { srcLang: action.track.srcLang, label: action.track.label },
				isLoadingContent: action.isLoadingContent,
				isTextImportOpen: action.isTextImportOpen ?? false,
				textImportValue: '',
			};

		case 'SET_MANUAL_LANGUAGE':
			if ( state.view !== 'manual' ) {
				return state;
			}
			return { ...state, track: { ...state.track, srcLang: action.srcLang, label: action.label } };

		case 'SEED_CUE_BLOCKS':
			if ( state.view !== 'manual' ) {
				return state;
			}
			return {
				...state,
				cueBlocks: action.cueBlocks,
				cueBaseline: getCueBlocksSignature( action.cueBlocks ),
				isLoadingContent: false,
			};

		case 'CONTENT_LOAD_FAILED':
			if ( state.view !== 'manual' ) {
				return state;
			}
			return { ...state, isLoadingContent: false };

		case 'MARK_SAVED':
			if ( state.view !== 'manual' ) {
				return state;
			}
			/*
			 * Only the baseline moves; touching `cueBlocks` here would re-seed the
			 * editor and revert anything typed while the save was in flight.
			 */
			return {
				...state,
				captionTrackId: action.captionTrackId,
				cueBaseline: getCueBlocksSignature( action.cueBlocks ),
				trackBaseline: { srcLang: state.track.srcLang, label: state.track.label },
			};

		case 'SET_TEXT_IMPORT_OPEN':
			if ( state.view !== 'manual' ) {
				return state;
			}
			return {
				...state,
				isTextImportOpen: action.isOpen,
				textImportValue: action.isOpen ? state.textImportValue : '',
			};

		case 'SET_TEXT_IMPORT_VALUE':
			if ( state.view !== 'manual' ) {
				return state;
			}
			return { ...state, textImportValue: action.value };

		case 'IMPORT_CUES': {
			if ( state.view !== 'manual' ) {
				return state;
			}
			const cueBlocks =
				action.mode === 'append'
					? [
							...action.currentCueBlocks.filter( block =>
								String( block.attributes?.text ?? '' ).trim()
							),
							...action.cueBlocks,
					  ]
					: action.cueBlocks;
			return { ...state, cueBlocks, isTextImportOpen: false, textImportValue: '' };
		}

		default:
			return state;
	}
}

/**
 * Whether the manual editor's saveable state — the track fields and cue
 * blocks — differs from its baselines, i.e. whether "Save draft" has
 * anything to persist.
 *
 * @param state     - Current manual workspace state.
 * @param cueBlocks - The editor's live cue blocks.
 * @return Whether there are unsaved track edits.
 */
export function hasUnsavedTrackEdits(
	state: ManualWorkspace,
	cueBlocks: CaptionCueBlock[]
): boolean {
	if (
		state.track.srcLang !== state.trackBaseline.srcLang ||
		state.track.label !== state.trackBaseline.label
	) {
		return true;
	}

	return getCueBlocksSignature( cueBlocks ) !== state.cueBaseline;
}

/**
 * Whether the manual editor holds unsaved work, to guard close/back/drop-to-upload.
 * Unlike {@link hasUnsavedTrackEdits} this also counts pasted-but-unimported
 * text, which a close would discard even though "Save draft" wouldn't persist it.
 *
 * @param state     - Current workspace state.
 * @param cueBlocks - The editor's live cue blocks.
 * @return Whether there are unsaved manual edits.
 */
export function hasUnsavedManualEdits(
	state: WorkspaceState,
	cueBlocks: CaptionCueBlock[]
): boolean {
	if ( state.view !== 'manual' ) {
		return false;
	}

	if ( state.textImportValue.trim() ) {
		return true;
	}

	return hasUnsavedTrackEdits( state, cueBlocks );
}
