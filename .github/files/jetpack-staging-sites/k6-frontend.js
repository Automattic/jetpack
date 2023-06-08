/* eslint-disable eqeqeq */
import { check, sleep } from 'k6';
import http from 'k6/http';
import { sites } from './k6-shared.js';

export const options = {
	vus: 2,
	duration: '10s',
	thresholds: {
		checks: [
			{
				/**
				 * Successful checks should exceed 98%.
				 * see: https://k6.io/docs/using-k6/thresholds/#fail-a-load-test-using-checks
				 */
				threshold: 'rate > 0.98',
			},
		],
	},
};

/**
 * Default test function.
 */
export default function () {
	sites.forEach( site => {
		// Homepage.
		let res = http.get( site.url );
		check( res, {
			'status was 200': r => r.status == 200,
		} );

		// A random post.
		res = http.get( `${ site.url }/?random` );
		check( res, {
			'status was 200': r => r.status == 200,
		} );

		// Todo: Kitchen sink post (Jetpack blocks)
	} );

	sleep( 1 );
}
