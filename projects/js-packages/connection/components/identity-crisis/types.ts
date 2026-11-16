import type { ReactNode } from 'react';

/**
 * Text a plugin can override through the `jetpack_idc_consumers` filter's `customContent`.
 *
 * Values may use the `<em>`, `<strong>`, `<hostname>` and `<safeModeLink>` tags the earlier
 * Safe Mode screen accepts, so existing overrides keep working.
 */
export interface IdentityCrisisCustomContent {
	headerText?: string;
	logoAlt?: string;
	mainTitle?: string;
	mainBodyText?: string;
	mainBodyTextDev?: string;
	migratedTitle?: string;
	migratedBodyText?: string;
	migrateCardTitle?: string;
	migrateButtonLabel?: string;
	migrateCardBodyText?: string;
	startFreshCardTitle?: string;
	startFreshCardBodyText?: string;
	startFreshCardBodyTextDev?: string;
	startFreshButtonLabel?: string;
	safeModeTitle?: string;
	safeModeCardBodyText?: string;
	stayInSafeModeButtonLabel?: string;
	nonAdminTitle?: string;
	nonAdminBodyText?: string;
	supportURL?: string;
	dynamicSiteUrlText?: string;
	dynamicSiteUrlSupportLink?: string;
}

export interface IdentityCrisisLayoutProps {
	/** A string is used as an image URL; anything else renders as given. Defaults to the Jetpack logo. */
	logo?: ReactNode;
	customContent?: IdentityCrisisCustomContent;
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
	/** Shown above the button, e.g. an `IdentityCrisisErrorNotice` for this option's action. */
	error?: ReactNode;
}

export interface IdentityCrisisMigratedProps {
	/** The address WordPress.com has on record. */
	wpcomHomeUrl: string;
	/** This site's address. */
	currentUrl: string;
	customContent?: IdentityCrisisCustomContent;
	/** Omit to show no button, for hosts that move on by themselves. */
	onDone?: () => void;
}

export interface IdentityCrisisNonAdminProps {
	customContent?: IdentityCrisisCustomContent;
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
