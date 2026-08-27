/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * The keys bound on the single response page.
 *
 * Each entry carries both the `event.key` to match and the label to advertise, so
 * the menu items and arrow tooltips describe themselves from the same source that
 * binds them — the hint a user reads and the key that actually works cannot drift
 * apart. The two differ for `Escape`, which is spelled "Esc" everywhere a person
 * reads it.
 *
 * Keys follow the conventions of the mail clients this page's triage flow
 * resembles: `j`/`k` to move through a list, `#` to bin something, `!` to report
 * spam, `Escape` to back out to the list. Arrow keys are kept alongside `j`/`k`
 * because they were the page's original binding.
 *
 * The two destructive keys are both shifted symbols, which is a feature: they are
 * meaningfully harder to hit by accident than a bare letter would be.
 */
export const SHORTCUTS = {
	next: { key: 'j', display: 'j' },
	previous: { key: 'k', display: 'k' },
	moveToTrash: { key: '#', display: '#' },
	markAsSpam: { key: '!', display: '!' },
	goToList: { key: 'Escape', display: 'Esc', ariaLabel: 'Escape' },
} as const;

export type ResponseShortcutHandlers = {
	onNext?: () => void;
	onPrevious?: () => void;
	onMarkAsSpam?: () => void;
	onMoveToTrash?: () => void;
	onGoToList?: () => void;
};

/**
 * Whether a keyboard event should be ignored because the user is typing.
 *
 * @param event - The keyboard event.
 * @return Whether the event targets an editable field.
 */
function isTypingTarget( event: KeyboardEvent ): boolean {
	const target = event.target as HTMLElement | null;
	const tag = target?.tagName;

	return (
		tag === 'INPUT' ||
		tag === 'TEXTAREA' ||
		tag === 'SELECT' ||
		Boolean( target?.isContentEditable )
	);
}

/**
 * Keyboard shortcuts for the standalone single response page.
 *
 * Bound on `window` rather than through `@wordpress/keyboard-shortcuts`, matching
 * how this page already handled its arrow keys. The shortcut store's main draw is
 * the help modal, which lives in `@wordpress/editor` and is not available here —
 * the keys are advertised on the menu items and arrow tooltips instead.
 *
 * `preventDefault` is called only when a shortcut actually runs, so arrow-key page
 * scrolling still works at the ends of the list and unbound keys behave normally.
 *
 * The handlers are held in a ref so that the listener is attached once rather than
 * being torn down and rebuilt on every render — with `isDisabled` in the dependency
 * list, a listener rebuilt mid-action could otherwise miss or double-handle a key.
 *
 * `Escape` is the one binding that has to be actively defended: it also dismisses
 * the actions menu, the file preview and the confirmation dialog. Every one of
 * those states must reach `isDisabled`, or dismissing them would navigate the user
 * off the response as a side effect.
 *
 * @param handlers           - The actions to run. A missing handler leaves its key unbound.
 * @param options            - Options.
 * @param options.isDisabled - Suspends every shortcut (a modal or menu is open, a
 *                           confirmation is pending).
 */
export default function useResponseKeyboardShortcuts(
	handlers: ResponseShortcutHandlers,
	{ isDisabled = false }: { isDisabled?: boolean } = {}
): void {
	const handlersRef = useRef( handlers );
	const isDisabledRef = useRef( isDisabled );

	useEffect( () => {
		handlersRef.current = handlers;
		isDisabledRef.current = isDisabled;
	} );

	useEffect( () => {
		const handleKeyDown = ( event: KeyboardEvent ) => {
			// Modifier combinations belong to the browser and the OS. Shift is not
			// checked, because `!` and `#` are typed with it.
			if ( event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey ) {
				return;
			}

			if ( isDisabledRef.current || isTypingTarget( event ) ) {
				return;
			}

			const { onNext, onPrevious, onMarkAsSpam, onMoveToTrash, onGoToList } = handlersRef.current;

			// `event.key` is the produced character, so `!` and `#` are matched
			// directly and keep working on layouts that place them elsewhere.
			const binding: Record< string, ( () => void ) | undefined > = {
				[ SHORTCUTS.next.key ]: onNext,
				ArrowDown: onNext,
				[ SHORTCUTS.previous.key ]: onPrevious,
				ArrowUp: onPrevious,
				[ SHORTCUTS.moveToTrash.key ]: onMoveToTrash,
				[ SHORTCUTS.markAsSpam.key ]: onMarkAsSpam,
				[ SHORTCUTS.goToList.key ]: onGoToList,
			};

			const handler = binding[ event.key ];

			if ( handler ) {
				event.preventDefault();
				handler();
			}
		};

		window.addEventListener( 'keydown', handleKeyDown );
		return () => window.removeEventListener( 'keydown', handleKeyDown );
	}, [] );
}
