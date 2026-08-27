import { apiCall, apiPath } from './_helpers';

/**
 * Response of `GET /jetpack/v4/site/backup/policies`.
 *
 * The route forwards WordPress.com's body verbatim, which nests
 * everything under a `policies` object. That object is the only thing
 * here worth reading, and it is genuinely nullable: a site whose plan
 * carries no retention policy answers `{ policies: null }` inside a 200.
 *
 * An upstream answer the route cannot decode still collapses to a bare
 * `null` body served as HTTP 200 — so `null` at the top level means "we
 * could not read this", while `{ policies: null }` means "there is no
 * policy". Callers must not conflate the two with the storage limit
 * they both produce, which is `null` either way.
 *
 * Note `storage_limit_bytes` lives *here* and not on `/site/backup/size`,
 * despite the name suggesting otherwise. See `site-size.ts`.
 */
export type RawSitePolicies = {
	policies?: {
		storage_limit_bytes?: number | null;
		activity_log_limit_days?: number | null;
	} | null;
} | null;

/**
 * Fetch the site's backup retention and storage policies.
 *
 * @return WordPress.com's payload, or `null` when it could not be read.
 */
export async function fetchSitePolicies(): Promise< RawSitePolicies > {
	return apiCall< RawSitePolicies >( { path: apiPath( '/site/backup/policies' ) } );
}
