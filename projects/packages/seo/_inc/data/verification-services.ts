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
