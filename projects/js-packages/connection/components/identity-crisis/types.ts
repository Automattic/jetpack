import type { ReactNode } from 'react';

export interface IdentityCrisisLayoutProps {
	/** A string is used as an image URL; anything else renders as given. Defaults to the Jetpack logo. */
	logo?: ReactNode;
	children: ReactNode;
	/** Actions the host adds below the content, such as Disconnect on the Connectors card. */
	hostActions?: ReactNode;
}

export interface IdentityCrisisOptionProps {
	title: ReactNode;
	description: ReactNode;
	/** Shown between the description and the button, e.g. `IdentityCrisisAddresses`. */
	visual?: ReactNode;
	buttonLabel: string;
	onClick: () => void;
	isBusy?: boolean;
	disabled?: boolean;
	isPrimary?: boolean;
	/** Shown above the button, e.g. `<IdentityCrisisErrorNotice error={ error } action="migrate" />`. */
	error?: ReactNode;
}

export interface IdentityCrisisMigratedProps {
	/** The address WordPress.com has on record. */
	wpcomHomeUrl: string;
	/** This site's address. */
	currentUrl: string;
	/** Omit to show no button, for hosts that move on by themselves. */
	onDone?: () => void;
}

export interface IdentityCrisisOptionsProps {
	/** `IdentityCrisisOption` elements. */
	children: ReactNode;
}

export interface IdentityCrisisAddressesProps {
	/** The address WordPress.com has on record. */
	wpcomHomeUrl: string;
	/** This site's address. */
	currentUrl: string;
	/** `move` for Migrate (an arrow), `separate` for a fresh connection (a dash). */
	variant: 'move' | 'separate';
}
