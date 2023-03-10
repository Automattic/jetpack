import apiFetch from '@wordpress/api-fetch';

const useMetaUpdate = id => {
	const mapCamelToSnakeCase = {
		allowDownload: 'allow_download',
		displayEmbed: 'display_embed',
	};

	const convertToSnakeCase = obj =>
		Object.keys( obj ).reduce( ( result, key ) => {
			result[ mapCamelToSnakeCase[ key ] || key ] = obj[ key ];
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
