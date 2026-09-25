// Single source of truth for the search-engine/social verification services the
// SEO feature supports, in display order. Consumed by the Settings verification
// card, the Overview verification card, and the save-payload builder — so a
// service is added or removed in exactly one place.
//
// Labels are brand names and are intentionally not translated.

import type { VerificationKey } from './settings-types';

export const VERIFICATION_SERVICES: ReadonlyArray< { key: VerificationKey; label: string } > = [
	{ key: 'google', label: 'Google' },
	{ key: 'bing', label: 'Bing' },
	{ key: 'pinterest', label: 'Pinterest' },
	{ key: 'yandex', label: 'Yandex' },
	{ key: 'facebook', label: 'Facebook' },
];

export const VERIFICATION_KEYS: readonly VerificationKey[] = VERIFICATION_SERVICES.map(
	service => service.key
);

// The services broadly relevant wherever a site is in the world. The Overview
// card leads with these so its summary isn't padded out with rows most sites will
// never use; the Settings module still offers all five, and any of the five still
// completes verification on its own. Not a judgement about the other services —
// purely which ones earn a permanent row on a dashboard summary.
export const PRIMARY_VERIFICATION_KEYS: readonly VerificationKey[] = [
	'google',
	'bing',
	'facebook',
];
