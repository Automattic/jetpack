/**
 * Split a domain so the subdomain can truncate while the rest stays readable.
 *
 * @param domainName - The full domain.
 * @return The first label, and the remainder with its leading dot, empty if there is none.
 */
export function splitDomainName( domainName: string ) {
	const [ first, ...rest ] = domainName.split( '.' );

	return { first, rest: rest.length > 0 ? '.' + rest.join( '.' ) : '' };
}
