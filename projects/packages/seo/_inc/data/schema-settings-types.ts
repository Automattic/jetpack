// Site-level Schema.org settings.
//
// Read and written through the package's own REST route
// (`/jetpack/v4/seo/schema-settings`) — see `Schema_Settings_Controller`. The
// route returns the *stored overrides* (empty where the admin hasn't set a value)
// plus the site-identity *defaults* the form shows as field placeholders, so an
// empty field tracks the Site Title / Tagline instead of freezing its value.
//
// The response is a container keyed by schema type so later types (LocalBusiness,
// Breadcrumb) can be added without changing the contract; only `organization` is
// implemented today.

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

export interface SchemaSettings {
	/** The stored overrides; empty fields fall back to the matching default. */
	organization: OrganizationSettings;
	/** Site-identity values used as placeholders. */
	defaults: {
		organization: OrganizationDefaults;
	};
}
