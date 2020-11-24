export function convertToSlug( text ) {
    return text
        .toLowerCase()
        .replace( / /g,'-' )
        .replace( /[^\w-]+/g, '' );
}

export function getCurrentLabelValue( labels, slug ) {
	const labelBySlug = find( labels, ( label ) => label.slug === slug );
	return slug && labelBySlug ? labelBySlug : labels[ 0 ];
}
