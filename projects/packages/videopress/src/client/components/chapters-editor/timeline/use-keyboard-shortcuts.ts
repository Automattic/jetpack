/**
 * Document-level keyboard shortcuts for the chapters editor.
 *
 * Space play/pause, ←/→ nudge the playhead ±100ms (±1s with Shift), Home/End
 * jump to the start/end of the video, Delete/Backspace removes the selected
 * chapter, and mod+Z / shift+mod+Z undo/redo.
 *
 * The listener bails on editable targets (inputs, textareas, selects,
 * contenteditable) so typing in the timecode box never toggles playback, on
 * focused interactive controls (buttons, links, menu items) so Space/Enter
 * activate the control instead of driving the editor behind it, and on
 * already-handled events (the focusable timeline sliders preventDefault and
 * stopPropagation their own arrow keys before this listener runs).
 */
import { useEffect, useRef } from 'react';

/**
 * Playhead nudge per arrow-key press, in ms.
 */
export const NUDGE_MS = 100;

/**
 * Playhead nudge per shift+arrow press, in ms.
 */
export const NUDGE_LARGE_MS = 1000;

/**
 * Callbacks for {@link useKeyboardShortcuts}.
 */
export interface KeyboardShortcuts {
	/** False detaches the listener entirely (e.g. while a modal is open). */
	enabled?: boolean;
	/** Space. */
	onTogglePlay: () => void;
	/** ←/→, with the signed delta (±100 or ±1000). */
	onNudge: ( deltaMs: number ) => void;
	/** Home — jump to the start of the video. */
	onHome: () => void;
	/** End — jump to the end of the video. */
	onEnd: () => void;
	/** Delete/Backspace — remove the selected chapter. */
	onRemoveSelected: () => void;
	/** mod+Z. */
	onUndo: () => void;
	/** shift+mod+Z. */
	onRedo: () => void;
}

/**
 * Selector for focused controls the shortcuts must never talk over: keyboard
 * activation (Space/Enter) belongs to the control, and arrow keys may drive
 * menu/radio navigation. Matched via `closest` so a focus target inside a
 * control (an icon, say) is covered too.
 */
const INTERACTIVE_CONTROL_SELECTOR = [
	'button',
	'a[href]',
	'summary',
	'[role="button"]',
	'[role="link"]',
	'[role="menuitem"]',
	'[role="menuitemcheckbox"]',
	'[role="menuitemradio"]',
].join( ', ' );

/**
 * Whether a keyboard event targets an element the shortcuts must leave alone:
 * anything editable (typing) or an interactive control (activation).
 *
 * Exported for hosts that map the same shortcuts themselves instead of using
 * this document-level listener — the block editor's chapter manager modal
 * handles them on its own body, since document-level listeners fight
 * Gutenberg's shortcut handling — so both bail on the same targets.
 *
 * @param target - The event target.
 * @return True when the shortcuts should ignore the event.
 */
export function isExemptTarget( target: EventTarget | null ): boolean {
	if ( ! ( target instanceof Element ) ) {
		return false;
	}
	if (
		target instanceof HTMLElement &&
		( target.tagName === 'INPUT' ||
			target.tagName === 'TEXTAREA' ||
			target.tagName === 'SELECT' ||
			target.isContentEditable )
	) {
		return true;
	}
	return target.closest( INTERACTIVE_CONTROL_SELECTOR ) !== null;
}

/**
 * Attach the editor's document-level keydown shortcuts.
 *
 * @param shortcuts - Enabled flag and per-shortcut callbacks.
 */
export function useKeyboardShortcuts( shortcuts: KeyboardShortcuts ): void {
	const shortcutsRef = useRef( shortcuts );
	shortcutsRef.current = shortcuts;
	const enabled = shortcuts.enabled ?? true;

	useEffect( () => {
		if ( ! enabled ) {
			return;
		}

		const onKeyDown = ( event: KeyboardEvent ) => {
			if ( event.defaultPrevented || isExemptTarget( event.target ) ) {
				return;
			}
			const current = shortcutsRef.current;
			const mod = event.metaKey || event.ctrlKey;

			if ( mod ) {
				if ( event.key.toLowerCase() === 'z' && ! event.altKey ) {
					event.preventDefault();
					if ( event.shiftKey ) {
						current.onRedo();
					} else {
						current.onUndo();
					}
				}
				return;
			}
			if ( event.altKey ) {
				return;
			}

			switch ( event.key ) {
				case ' ':
					event.preventDefault();
					current.onTogglePlay();
					break;
				case 'ArrowLeft':
					event.preventDefault();
					current.onNudge( event.shiftKey ? -NUDGE_LARGE_MS : -NUDGE_MS );
					break;
				case 'ArrowRight':
					event.preventDefault();
					current.onNudge( event.shiftKey ? NUDGE_LARGE_MS : NUDGE_MS );
					break;
				case 'Home':
					event.preventDefault();
					current.onHome();
					break;
				case 'End':
					event.preventDefault();
					current.onEnd();
					break;
				case 'Delete':
				case 'Backspace':
					event.preventDefault();
					current.onRemoveSelected();
					break;
			}
		};

		document.addEventListener( 'keydown', onKeyDown );
		return () => document.removeEventListener( 'keydown', onKeyDown );
	}, [ enabled ] );
}
