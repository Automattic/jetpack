import type { Icon } from '@wordpress/ui';
import type { ComponentProps } from 'react';

/**
 * The prompts this page can show. Kept in sync with the STATE_* constants in
 * class-wpcom-hosting-feature-page.php.
 */
export type FeatureState = 'upgrade' | 'in_progress' | 'activate';

/**
 * One blocking eligibility error, in the shape the wpcom eligibility API
 * returns it. The page maps `code` to its own copy, falling back to `message`.
 */
export type TransferError = {
	code: string;
	message: string;
};

/** The site's address before and after a transfer. */
export type DomainNames = {
	current: string;
	new: string;
};

/**
 * One transfer warning, in the shape the wpcom eligibility API returns it.
 *
 * Snake_case because PHP passes the API's own response through untouched; the
 * Calypso dashboard reads the same fields.
 */
export type TransferWarning = {
	id: string;
	description: string;
	domain_names: DomainNames | null;
	support_url: string;
};

/**
 * State resolved in PHP and localized onto the page's prerequisites script.
 *
 * Resolved server-side because the plan, transfer and eligibility checks read
 * wpcom-only libraries with no REST equivalent the page could call.
 */
export type InitialState = {
	state: FeatureState;
	domain: string;
	/** Whether the site passed every transfer check. */
	isEligible: boolean;
	/** Blocking transfer errors. Only populated in the `activate` state. */
	errors: TransferError[];
	/** Non-blocking transfer warnings. Only populated in the `activate` state. */
	warnings: TransferWarning[];
	upgradeUrl: string;
	activateUrl: string;
};

/**
 * Everything that differs between one hosting feature's page and another's.
 *
 * Built by a function rather than at module scope, so `__()` runs once the
 * locale data is loaded.
 */
export type FeatureConfig = {
	/** Product name for the page heading. Not translated. */
	productName: string;
	subTitle: string;
	icon: ComponentProps< typeof Icon >[ 'icon' ];
	/** Callout illustration URL. */
	illustration: string;
	/** The upsell and feature ID the matching dashboard page reports. */
	tracksFeatureId: string;
	/** This page's wp-admin path, which marks its Tracks events. */
	tracksPath: string;
	upgrade: {
		title: string;
		description: string;
	};
	activate: {
		title: string;
		description: string;
		/** Label for the call to action, in the callout and the confirmation modal. */
		action: string;
	};
	inProgress: {
		title: string;
		description: string;
	};
	modal: {
		/** Title when the transfer cannot start. */
		blockedTitle: string;
		/** Why the site has to move, shown to an eligible site. */
		intro: string;
		/** Heading above the steps the reader can take themselves. */
		holdsHeading: string;
	};
};

declare global {
	interface Window {
		wpcomHostingFeatureInitialState?: InitialState;
	}
}
