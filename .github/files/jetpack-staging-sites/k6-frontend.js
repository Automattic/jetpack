/* eslint-disable eqeqeq */
import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { sites } from './k6-shared.js';

export const options = {
	vus: 1,
	iterations: 1,
	thresholds: {
		checks: [
			{
				/**
				 * Fail if the number of failed checks is greater than 0.
				 * see: https://k6.io/docs/using-k6/thresholds/#fail-a-load-test-using-checks
				 */
				threshold: 'rate == 1.0',
			},
		],
	},
};

/**
 * Default test function.
 */
export default function () {
	sites.forEach( site => {
		group( `Frontend tests for site: ${ site.url } ( ${ site.blog_id } )`, () => {
			// Homepage.
			let res = http.get( site.url );
			check( res, {
				'homepage status was 200': r => r.status == 200,
			} );

			// A random post.
			res = http.get( `${ site.url }/?random` );
			check( res, {
				'random post status was 200': r => r.status == 200,
			} );
		} );
	} );

	sleep( 1 );
}
