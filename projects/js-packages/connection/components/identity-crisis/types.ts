import type {
	IdentityCrisisAction,
	IdentityCrisisError,
} from '../../hooks/use-identity-crisis-actions/types';
import type { ReactNode } from 'react';

/** What a host does after an action succeeds. */
export type IdentityCrisisActionResult =
	| { action: 'migrate' }
	| { action: 'start-fresh'; connectUrl: string }
	| { action: 'confirm-safe-mode' };

export interface IdentityCrisisProps {
	/** Where the screen shows; the events' `context` (CONNECT-620). */
	context: 'notice' | 'my-jetpack' | 'connectors';
	/** Show the logo and heading; false where the host already shows both, as the Connectors card does. Defaults to true. */
	showHeader?: boolean;
	/** Admin path to return to after a fresh connection. */
	redirectUri?: string;
	/** Name from `CONNECTION_FROM`, reported to WordPress.com with a fresh connection. */
	from?: string;
	/** Host actions below the content, e.g. Disconnect on the Connectors card. Shown only to viewers who can resolve Safe Mode. */
	hostActions?: ReactNode;
	/** After an action succeeds. Migrate fires before its done view shows. Defaults to `onIdentityCrisisActionSuccess`. */
	onActionSuccess?: ( result: IdentityCrisisActionResult ) => void;
	/** "Got it, thanks" on the migrate-done view. Defaults to reloading the page. */
	onMigratedDone?: () => void;
	/** Dismiss for viewers who cannot resolve Safe Mode; no button without it. */
	onDismiss?: () => void;
}

export interface IdentityCrisisLayoutProps {
	/** `identityCrisis.logoUrl` from the connection state: the connected plugins' marks. Defaults to the Jetpack logo. */
	logoUrl?: string;
	/** Show the logo and heading; hide them where the host already shows both. Defaults to true. */
	showHeader?: boolean;
	children: ReactNode;
	/** Actions the host adds below the content, such as Disconnect on the Connectors card. */
	hostActions?: ReactNode;
}

export interface IdentityCrisisMigratedProps {
	/** The address WordPress.com has on record. */
	wpcomHomeUrl?: string;
	/** This site's address. */
	currentUrl?: string;
	/** Omit to show no button, for hosts that move on by themselves. */
	onDone?: () => void;
}

export interface IdentityCrisisAddressesProps {
	/** The address WordPress.com has on record. */
	wpcomHomeUrl?: string;
	/** This site's address. */
	currentUrl?: string;
	/** Say "store" instead of "site": a WooCommerce-family plugin is connected. */
	isStore?: boolean;
}

export interface IdentityCrisisNonAdminProps {
	/** Say "store" instead of "site", and that payments continue. */
	isStore?: boolean;
	/** Omit to show no Dismiss button; the host decides what dismissing does. */
	onDismiss?: () => void;
}

export interface IdentityCrisisErrorNoticeProps {
	error: IdentityCrisisError | null;
	/** Show only a failure of this action, e.g. next to that action's button. Omit to show any. */
	action?: IdentityCrisisAction;
}
