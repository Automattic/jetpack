/* eslint-disable eqeqeq */
/* eslint import/no-unresolved: [ 'error', { ignore: [ '^k6' ] } ] */ // Provided by the Action that runs this file.
import { check, group } from 'k6';
import http from 'k6/http';
import { encodedCredentials, sites } from './k6-shared.js';

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
	tlsCipherSuites: [ 'TLS_AES_256_GCM_SHA384' ],
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
			let res = http.get( `${ site.url }/wp-json/jetpack/v4/connection/test`, params );
			check( res, {
				'connection status was 200': r => r.status == 200,
				'verify connection message': r => r.body.includes( 'All connection tests passed' ),
			} );
			console.log( `${ site.url } connection test: ${ res.status }` );

			// Jetpack sync status.
			res = http.get( `${ site.url }/wp-json/jetpack/v4/sync/status`, params );
			check( res, {
				'sync status was 200': r => r.status == 200,
			} );
			console.log( `${ site.url } sync status: ${ res.status }` );

			// /wp-json/wp/v2/posts
			res = http.get( `${ site.url }/wp-json/wp/v2/posts`, params );
			check( res, {
				'posts status was 200': r => r.status == 200,
			} );
			console.log( `${ site.url } posts: ${ res.status }` );

			// /wp-json/wp/v2/categories
			res = http.get( `${ site.url }/wp-json/wp/v2/categories`, params );
			check( res, {
				'categories status was 200': r => r.status == 200,
			} );
			console.log( `${ site.url } categories: ${ res.status }` );

			// /wp-json/wp-site-health/v1/tests/dotorg-communication
			res = http.get(
				`${ site.url }/wp-json/wp-site-health/v1/tests/dotorg-communication`,
				params
			);
			check( res, {
				'dotorg-communication status was 200': r => r.status == 200,
				'verify communication message': r =>
					r.body.includes( 'Can communicate with WordPress.org' ),
			} );
			console.log( `${ site.url } WP.org communication: ${ res.status }` );
		} );
	} );
}
