import type { ReactNode } from 'react';

export interface IdentityCrisisLayoutProps {
	/** A string is used as an image URL; anything else renders as given. Defaults to the Jetpack logo. */
	logo?: ReactNode;
	children: ReactNode;
	/** Actions the host adds below the content, such as Disconnect on the Connectors card. */
	hostActions?: ReactNode;
}

export interface IdentityCrisisMigratedProps {
	/** The address WordPress.com has on record. */
	wpcomHomeUrl: string;
	/** This site's address. */
	currentUrl: string;
	/** Omit to show no button, for hosts that move on by themselves. */
	onDone?: () => void;
}

export interface IdentityCrisisAddressesProps {
	/** The address WordPress.com has on record. */
	wpcomHomeUrl: string;
	/** This site's address. */
	currentUrl: string;
	/** `move` for Migrate (an arrow), `separate` for a fresh connection (a dash). */
	variant: 'move' | 'separate';
}
