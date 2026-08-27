/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * The keys bound on the single response page.
 *
 * Exported so the menu items and arrow tooltips label themselves from the same
 * source that binds them — the hint a user reads and the key that actually works
 * cannot drift apart.
 *
 * Keys follow the conventions of the mail clients this page's triage flow
 * resembles: `j`/`k` to move through a list, `e` to file something away, `!` to
 * report spam, `u` to go back up to the list. Arrow keys are kept alongside
 * `j`/`k` because they were the page's original binding.
 */
export const SHORTCUTS = {
	next: 'j',
	previous: 'k',
	moveToTrash: 'e',
	markAsSpam: '!',
	goToList: 'u',
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
 * @param handlers           - The actions to run. A missing handler leaves its key unbound.
 * @param options            - Options.
 * @param options.isDisabled - Suspends every shortcut (a modal is open, a
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
			// checked, because `!` is typed with it.
			if ( event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey ) {
				return;
			}

			if ( isDisabledRef.current || isTypingTarget( event ) ) {
				return;
			}

			const { onNext, onPrevious, onMarkAsSpam, onMoveToTrash, onGoToList } = handlersRef.current;

			// `event.key` is the produced character, so `!` is matched directly and
			// keeps working on layouts that place it elsewhere.
			const binding: Record< string, ( () => void ) | undefined > = {
				[ SHORTCUTS.next ]: onNext,
				ArrowDown: onNext,
				[ SHORTCUTS.previous ]: onPrevious,
				ArrowUp: onPrevious,
				[ SHORTCUTS.moveToTrash ]: onMoveToTrash,
				[ SHORTCUTS.markAsSpam ]: onMarkAsSpam,
				[ SHORTCUTS.goToList ]: onGoToList,
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
