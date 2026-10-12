import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterEarnTasks } from './tasks.ts';

const task = ( id: string, completed: boolean, calypso_path?: string ) => ( {
	id,
	title: id,
	completed,
	disabled: false,
	calypso_path,
} );

describe( 'filterEarnTasks', () => {
	it( 'takes completion of the Stripe and offer tasks from the page, not the server', () => {
		const tasks = filterEarnTasks(
			[
				task( 'stripe_connected', false ),
				task( 'paid_offer_created', true ),
				task( 'other', true ),
			],
			{ isConnected: true, hasProducts: false }
		);

		assert.deepEqual(
			tasks.map( ( { id, completed } ) => [ id, completed ] ),
			[
				[ 'stripe_connected', true ],
				[ 'paid_offer_created', false ],
				[ 'other', true ],
			]
		);
	} );

	it( 'sends Calypso paths to WordPress.com and leaves absolute URLs alone', () => {
		const [ relative, absolute ] = filterEarnTasks(
			[
				task( 'paid_offer_created', false, '/earn/payments/example.com#add-new-payment-plan' ),
				task( 'stripe_connected', false, 'https://connect.stripe.com/oauth/authorize?state=x' ),
			],
			{ isConnected: false, hasProducts: false }
		);

		assert.equal(
			relative.calypso_path,
			'https://wordpress.com/earn/payments/example.com#add-new-payment-plan'
		);
		assert.equal( absolute.calypso_path, 'https://connect.stripe.com/oauth/authorize?state=x' );
	} );
} );
