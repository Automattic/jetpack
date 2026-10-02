/**
 * Public type contract for the protected-owner confirmation, so a consumer rendering its own
 * dialog can type against the same shapes the package dialog uses.
 */

export interface ProtectedOwnerConfirmationProps {
	/** Whether the dialog is open. */
	isOpen: boolean;
	/** Called when the dialog closes without a successful claim. */
	onClose: () => void;
	/** Called after WordPress.com accepts the claim. */
	onConfirmed?: () => void;
	/** "site" or "store", already translated. */
	subject?: string;
	/** REST root. Falls back to the connection script data. */
	apiRoot?: string;
	/** REST nonce. Falls back to the connection script data. */
	apiNonce?: string;
}

export interface ProtectedOwnerConfirmationCopy {
	title: string;
	body: string;
	confirm: string;
	cancel: string;
	/** Label for the support link shown when another account already holds the site. */
	contactSupport: string;
	/** Fallback when the claim fails and the server sends no message. */
	confirmError: string;
	/** Destination for `contactSupport`. */
	supportUrl: string;
}

export interface ProtectedOwnerConfirmError {
	message: string;
	/** REST error code, absent when the server sent none or sent a non-string. */
	code?: string;
}
