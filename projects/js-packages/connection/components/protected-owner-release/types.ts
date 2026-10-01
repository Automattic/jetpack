/**
 * Public type contract for the protected-owner release, so a consumer rendering its own
 * dialog can type against the same shapes the package dialog uses.
 */

export interface ProtectedOwnerReleaseProps {
	/** Whether the dialog is open. */
	isOpen: boolean;
	/** Called when the dialog closes without a successful release. */
	onClose: () => void;
	/** Called after WordPress.com accepts the release. */
	onReleased?: () => void;
	/** "site" or "store", already translated. */
	subject?: string;
	/** REST root. Falls back to the connection script data. */
	apiRoot?: string;
	/** REST nonce. Falls back to the connection script data. */
	apiNonce?: string;
}

export interface ProtectedOwnerReleaseCopy {
	title: string;
	body: string;
	release: string;
	cancel: string;
	/** Label for the support link shown when the server refuses the release. */
	contactSupport: string;
	/** Fallback when the release fails and the server sends no message. */
	releaseError: string;
	/** Destination for `contactSupport`. */
	supportUrl: string;
}

export interface ProtectedOwnerReleaseError {
	message: string;
	/** REST error code, absent when the server sent none or sent a non-string. */
	code?: string;
}
