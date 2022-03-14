/**
 * Transforms a project name into a Readable name
 *
 * Example: project-slug into Project Slug
 *
 * @param {string} name - The project name
 * @param {boolean} jetpackPrefix - Whether to prefix the name with Jetpack
 * @returns {string} The transformed string
 */
export function transformToReadableName( name, jetpackPrefix = true ) {
	let readableName = name.replace( /[-._][a-z]/g, m => {
		return ' ' + m[ 1 ].toUpperCase();
	} );
	readableName = readableName.charAt( 0 ).toUpperCase() + readableName.slice( 1 );
	if ( jetpackPrefix ) {
		readableName = 'Jetpack ' + readableName;
	}
	return readableName;
}

/**
 * Normalize project name as slug
 *
 * Example: pro.ject_different-slug into pro-ject-different-slug
 *
 * @param {string} name - The project name
 * @param {boolean} jetpackPrefix - Whether to prefix the name with Jetpack
 * @returns {string} The transformed string
 */
export function normalizeSlug( name, jetpackPrefix = true ) {
	let slug = name.replace( /[-._]/g, '-' );
	if ( jetpackPrefix ) {
		slug = 'jetpack-' + slug;
	}
	return slug;
}

/**
 * Transforms a project name into the PHP Class name format
 *
 * Example: project-name into Project_Name
 *
 * @param {string} name - The project name
 * @param {boolean} jetpackPrefix - Whether to prefix the name with Jetpack
 * @returns {string} The transformed string
 */
export function transformToPhpClassName( name, jetpackPrefix = true ) {
	return transformToReadableName( name, jetpackPrefix ).replaceAll( ' ', '_' );
}

/**
 * Transforms a project name into the PHP Constant name format
 *
 * Example: project-name into PROJECT_NAME
 *
 * @param {string} name - The project name
 * @param {boolean} jetpackPrefix - Whether to prefix the name with Jetpack
 * @returns {string} The transformed string
 */
export function transformToPhpConstantName( name, jetpackPrefix = true ) {
	return transformToPhpClassName( name, jetpackPrefix ).toUpperCase();
}
