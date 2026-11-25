import { speak } from '@wordpress/a11y';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { check, copySmall } from '@wordpress/icons';
import { Button, IconButton } from '@wordpress/ui';

/**
 * Copy through a hidden text area, for browsers without the clipboard API (insecure origins).
 *
 * @param text - Text to copy.
 * @return Whether it worked.
 */
function legacyCopy( text: string ): boolean {
	const area = document.createElement( 'textarea' );
	area.value = text;
	area.setAttribute( 'readonly', '' );
	area.style.position = 'fixed';
	area.style.opacity = '0';
	document.body.appendChild( area );
	area.select();
	let copied: boolean;
	try {
		copied = document.execCommand( 'copy' );
	} catch {
		copied = false;
	}
	area.remove();
	return copied;
}

/**
 * Put text on the clipboard.
 *
 * @param text - Text to copy.
 * @return Whether it worked.
 */
export async function copyToClipboard( text: string ): Promise< boolean > {
	if ( navigator.clipboard?.writeText ) {
		try {
			await navigator.clipboard.writeText( text );
			return true;
		} catch {
			// Fall through to the older route.
		}
	}
	return legacyCopy( text );
}

/**
 * Copy, announce the result, and say so on the control for a moment.
 *
 * @param text          - Text to copy.
 * @param announcement  - Read out after copying.
 * @param onCopy        - Called after a successful copy.
 * @param unavailable   - Why there's no text to copy; a click says so instead of copying.
 * @param onUnavailable - Called on that click, e.g. to fetch the text again.
 * @return The last result and the copy callback.
 */
function useCopy(
	text: string,
	announcement: string | undefined,
	onCopy?: () => void,
	unavailable?: string,
	onUnavailable?: () => void
) {
	const [ result, setResult ] = useState< 'copied' | 'failed' | null >( null );
	const timer = useRef< ReturnType< typeof setTimeout > | null >( null );
	useEffect( () => () => timer.current && clearTimeout( timer.current ), [] );

	const run = useCallback( async () => {
		const copied = unavailable ? false : await copyToClipboard( text );
		setResult( copied ? 'copied' : 'failed' );
		if ( copied ) {
			speak( announcement ?? __( 'Copied', 'jetpack-send-pkg' ) );
			onCopy?.();
		} else if ( unavailable ) {
			speak( unavailable, 'assertive' );
			onUnavailable?.();
		} else {
			speak( __( 'Couldn’t copy. Select the text and copy it yourself.', 'jetpack-send-pkg' ) );
		}
		if ( timer.current ) {
			clearTimeout( timer.current );
		}
		timer.current = setTimeout( () => setResult( null ), copied ? 2000 : 4000 );
	}, [ text, announcement, onCopy, unavailable, onUnavailable ] );

	return { result, run };
}

type CopyValueButtonProps = {
	text: string;
	/** Accessible name naming what is copied. */
	label: string;
	/** Visible text before copying. */
	children?: string;
	/** Read out after copying. */
	announcement?: string;
	size?: 'compact' | 'default';
	onCopy?: () => void;
	/** The text is still loading, so there's nothing to copy yet. */
	loading?: boolean;
	disabled?: boolean;
	/** Why the text couldn't be loaded. A click says so, and calls `onUnavailable`, instead of copying. */
	unavailable?: string;
	onUnavailable?: () => void;
};

/**
 * A text Copy button, for copying a block of text such as the setup steps.
 *
 * @param props               - Component props.
 * @param props.text          - Text to copy.
 * @param props.label         - Accessible name.
 * @param props.children      - Visible text before copying.
 * @param props.announcement  - Read out after copying.
 * @param props.size          - Button size.
 * @param props.onCopy        - Called after a successful copy.
 * @param props.loading       - The text is still loading.
 * @param props.disabled      - There's nothing to copy.
 * @param props.unavailable   - Why the text couldn't be loaded.
 * @param props.onUnavailable - Called when it's clicked then.
 * @return The button.
 */
export const CopyValueButton = ( {
	text,
	label,
	children,
	announcement,
	size = 'compact',
	onCopy,
	loading = false,
	disabled = false,
	unavailable,
	onUnavailable,
}: CopyValueButtonProps ) => {
	const { result, run } = useCopy( text, announcement, onCopy, unavailable, onUnavailable );
	let content = children ?? __( 'Copy', 'jetpack-send-pkg' );
	if ( result === 'copied' ) {
		content = __( 'Copied', 'jetpack-send-pkg' );
	} else if ( result === 'failed' ) {
		content = __( 'Couldn’t copy', 'jetpack-send-pkg' );
	}

	return (
		<Button
			variant="outline"
			tone="neutral"
			size={ size }
			onClick={ run }
			loading={ loading }
			disabled={ disabled || loading }
			aria-label={ result ? undefined : label }
		>
			{ content }
		</Button>
	);
};

type CopyIconButtonProps = {
	text: string;
	/** What it copies, e.g. "Copy name, record 1". */
	label: string;
	onCopy?: () => void;
};

/**
 * The icon-only Copy button for a record name or value. Its label turns to "Copied" for a moment.
 *
 * @param props        - Component props.
 * @param props.text   - Text to copy.
 * @param props.label  - What it copies.
 * @param props.onCopy - Called after a successful copy.
 * @return The button.
 */
export const CopyIconButton = ( { text, label, onCopy }: CopyIconButtonProps ) => {
	const { result, run } = useCopy( text, undefined, onCopy );
	let shown = label;
	if ( result === 'copied' ) {
		shown = __( 'Copied', 'jetpack-send-pkg' );
	} else if ( result === 'failed' ) {
		shown = __( 'Couldn’t copy', 'jetpack-send-pkg' );
	}
	return (
		<IconButton
			// The tick shows the copy worked; the click closes the tooltip that would say so.
			icon={ result === 'copied' ? check : copySmall }
			label={ shown }
			variant="minimal"
			tone="neutral"
			size="small"
			onClick={ run }
		/>
	);
};
