import type {
	IdentityCrisisAction,
	IdentityCrisisError,
} from '../../hooks/use-identity-crisis-actions/types';
import type { ReactNode } from 'react';

export interface IdentityCrisisLayoutProps {
	/** `identityCrisis.logoUrl` from the connection state: the connected plugins' marks. Defaults to the Jetpack logo. */
	logoUrl?: string;
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
	/** `move` for Migrate (an arrow), `separate` for a fresh connection (a dash). */
	variant: 'move' | 'separate';
}

export interface IdentityCrisisErrorNoticeProps {
	error: IdentityCrisisError | null;
	/** Show only a failure of this action, e.g. next to that action's button. Omit to show any. */
	action?: IdentityCrisisAction;
}
