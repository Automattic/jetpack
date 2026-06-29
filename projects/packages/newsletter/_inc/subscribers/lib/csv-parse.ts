/**
 * Pull email addresses out of a CSV / TSV / TXT export. Mirrors the forgiving parser used in
 * Calypso's Add Subscribers flow so the wp-admin port accepts the same files reviewers throw at
 * it (Substack, Beehiiv, Mailchimp, Ghost, Patreon, Kit, Medium…). Server-side parsing happens on
 * WPCOM for the dedicated `/subscribers/import` endpoint, but we don't have multipart pass-through
 * here yet so we cherry-pick the email column on the client and reuse the existing JSON
 * `/subscribers/add` proxy.
 *
 * @param raw - File contents as a UTF-8 string.
 * @return Trimmed, lowercased, deduplicated email addresses found anywhere in the file.
 */
export function extractEmailsFromCsv( raw: string ): string[] {
	if ( ! raw ) {
		return [];
	}

	// Strip a UTF-8 BOM if present (common in CSVs from Mailchimp/Excel).
	const body = raw.replace( /^\uFEFF/, '' );

	// Greedy-but-permissive email pattern: any `local@domain.tld`-shaped run of characters,
	// regardless of which column it lives in. Splitting on commas/quotes/newlines isn't reliable
	// (Substack quotes their emails, Beehiiv puts them in the second column, Mailchimp sometimes
	// nests them in pipe-delimited fields). Pulling matches directly is cheaper and tolerates
	// header rows naturally.
	const matches = body.match( /[\w!#$%&'*+/=?^`{|}~.-]+@[\w-]+(?:\.[\w-]+)+/g ) ?? [];

	const seen = new Set< string >();
	const out: string[] = [];
	for ( const match of matches ) {
		const normalized = match.trim().toLowerCase();
		if ( normalized && ! seen.has( normalized ) ) {
			seen.add( normalized );
			out.push( normalized );
		}
	}
	return out;
}
