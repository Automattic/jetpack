// Site-level Schema.org settings: the *stored overrides* (empty where unset) plus
// the site-identity *defaults* shown as field placeholders, so an empty field
// tracks the Site Title / Tagline instead of freezing its value. A container keyed
// by schema type for future types.
// Written through the package's own route (`Schema_Settings_Controller`).

export interface OrganizationSettings {
	/** Display name override. Empty means "use the Site Title" (the placeholder default). */
	name: string;
	/** Short description override. Empty means "use the site Tagline" (the placeholder default). */
	description: string;
	/** Social / authoritative profile URLs emitted as the Organization's `sameAs`. */
	sameAs: string[];
	/** Optional contact email. Never auto-filled. */
	email: string;
}

// Site-identity values shown as field placeholders (what an empty override falls
// back to). Only the fields WordPress has a native source for: the Site Title
// (`name`) and Tagline (`description`).
export type OrganizationDefaults = Pick< OrganizationSettings, 'name' | 'description' >;

export interface LocalBusinessAddress {
	streetAddress: string;
	addressLocality: string;
	addressRegion: string;
	postalCode: string;
	addressCountry: string;
}

export type OpeningHoursDay = 'Mo' | 'Tu' | 'We' | 'Th' | 'Fr' | 'Sa' | 'Su';

export interface OpeningHoursEntry {
	opens: string;
	closes: string;
}

export interface LocalBusinessSettings {
	enabled: boolean;
	address: LocalBusinessAddress;
	telephone: string;
	geo: {
		latitude: string;
		longitude: string;
	};
	openingHours: Record< OpeningHoursDay, OpeningHoursEntry >;
	priceRange: string;
}

export interface LocalBusinessDefaults {
	address: LocalBusinessAddress;
}

export interface SchemaSettings {
	/** The stored overrides; empty fields fall back to the matching default. */
	organization: OrganizationSettings;
	/** LocalBusiness details stored as overrides; address fields can fall back to WooCommerce defaults. */
	localBusiness: LocalBusinessSettings;
	/** Site-identity values used as placeholders. */
	defaults: {
		organization: OrganizationDefaults;
		localBusiness: LocalBusinessDefaults;
	};
}
