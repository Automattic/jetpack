import apiFetch from '@wordpress/api-fetch';

const useMetaUpdate = id => {
	const updateMeta = data => {
		return new Promise( ( resolve, reject ) => {
			const apiData = Object.assign( { id }, data );

			apiFetch( {
				path: '/wpcom/v2/videopress/meta',
				method: 'POST',
				data: apiData,
			} )
				.then( result => {
					// check for wpcom status field, if set
					if ( 200 !== result?.status ) {
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
