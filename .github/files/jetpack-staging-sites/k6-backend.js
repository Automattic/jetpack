/* eslint-disable eqeqeq */
import { check, group } from 'k6';
import http from 'k6/http';
import { encodedCredentials, sites } from './shared.js';

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
	const params = {
		headers: {
			Authorization: `Basic ${ encodedCredentials }`,
		},
	};

	sites.forEach( site => {
		group( `Backend tests for site: ${ site.url } ( ${ site.blog_id } )`, () => {
			// Jetpack connection test.
			const res = http.get( `${ site.url }/wp-json/jetpack/v4/connection/test`, params );

			check( res, {
				'status was 200': r => r.status == 200,
				'verify connection message': r => r.body.includes( 'All connection tests passed' ),
			} );
		} );
	} );
}
