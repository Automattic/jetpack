import apiFetch from '@wordpress/api-fetch';
import actions from './actions';

const resolvers = {
	getJetpackScan: {
		isFulfilled: state => {
			return Object.keys( state?.jetpackScan ).length > 0;
		},

		fulfill: () => async ( { dispatch } ) => {
			const response = await apiFetch( {
				path: '/my-jetpack/v1/site/products/scan',
				method: 'GET',
			} );

			dispatch( actions.setJetpackScan( response ) );
		},
	},
};

export default resolvers;
