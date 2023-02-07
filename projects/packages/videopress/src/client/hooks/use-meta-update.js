import apiFetch from '@wordpress/api-fetch';

/*
 * Map object from video field name to block attribute name.
 * Only register those fields that have a different attribute name.
 */

const useMetaUpdate = id => {
	const mapCameltoSnakeCase = {
		allowDownload: 'allow_download',
		displayEmbed: 'display_embed',
	};

	const convertToSnakeCase = obj =>
		Object.keys( obj ).reduce( ( result, key ) => {
			result[ mapCameltoSnakeCase[ key ] || key ] = obj[ key ];
			return result;
		}, {} );

	const updateMeta = data => {
		return new Promise( ( resolve, reject ) => {
			const apiData = convertToSnakeCase( Object.assign( { id }, data ) );

			apiFetch( {
				path: '/wpcom/v2/videopress/meta',
				method: 'POST',
				data: apiData,
			} )
				.then( result => {
					// check for code, if set
					if ( 'success' !== result?.code ) {
						reject();
						return;
					}
				} )
				.catch( e => reject( e ) )
				.finally( () => {
					resolve();
				} );
		} );
	};

	return updateMeta;
};

export default useMetaUpdate;
