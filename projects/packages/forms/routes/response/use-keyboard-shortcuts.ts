/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

export type ResponseShortcutHandlers = {
	onNext?: () => void;
	onPrevious?: () => void;
	onMarkAsSpam?: () => void;
	onMoveToTrash?: () => void;
	onGoToList?: () => void;
	onShowHelp?: () => void;
};

/**
 * The shortcuts, in the order they are listed in the help dialog.
 *
 * Keys follow the conventions of the mail clients this page's triage flow
 * resembles — `j`/`k` to move through a list, `e` to file something away, `!` to
 * report spam, `u` to go back up to the list, `?` for help. Arrow keys are kept
 * alongside `j`/`k` because they were the page's original binding.
 *
 * @return The shortcut descriptions, translated.
 */
export function getShortcutDescriptions(): { keys: string[]; description: string }[] {
	return [
		{ keys: [ 'j', '↓' ], description: __( 'Next response', 'jetpack-forms' ) },
		{ keys: [ 'k', '↑' ], description: __( 'Previous response', 'jetpack-forms' ) },
		{ keys: [ 'e' ], description: __( 'Move to trash', 'jetpack-forms' ) },
		{ keys: [ '!' ], description: __( 'Mark as spam', 'jetpack-forms' ) },
		{ keys: [ 'u' ], description: __( 'Back to responses', 'jetpack-forms' ) },
		{ keys: [ '?' ], description: __( 'Show keyboard shortcuts', 'jetpack-forms' ) },
	];
}

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
 * how this page already handled its arrow keys, and because the shortcut store's
 * value here would be the help modal it does not actually provide outside the
 * editor.
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
 * @param options.isDisabled - Suspends every shortcut (a modal is open, a mutation
 *                           is in flight).
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
			// checked, because `!` and `?` are typed with it.
			if ( event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey ) {
				return;
			}

			if ( isDisabledRef.current || isTypingTarget( event ) ) {
				return;
			}

			const { onNext, onPrevious, onMarkAsSpam, onMoveToTrash, onGoToList, onShowHelp } =
				handlersRef.current;

			// `event.key` is the produced character, so `!` and `?` are matched
			// directly and keep working on layouts that place them elsewhere.
			const binding: Record< string, ( () => void ) | undefined > = {
				j: onNext,
				ArrowDown: onNext,
				k: onPrevious,
				ArrowUp: onPrevious,
				e: onMoveToTrash,
				'!': onMarkAsSpam,
				u: onGoToList,
				'?': onShowHelp,
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
