import { beforeEach, describe, expect, it } from '@jest/globals';
import {
	getFormsIntegration,
	getFormsIntegrations,
	registerFormsIntegration,
	resetFormsIntegrations,
} from '../../../src/integrations/registry.ts';

const queueHolder = window as unknown as { jetpackFormsIntegrations?: unknown[] };

const buildCard = () => ( { id: 'acme/slack', title: 'Slack', description: '' } );

describe( 'Forms integration registry', () => {
	beforeEach( () => {
		resetFormsIntegrations();
	} );

	it( 'picks up a registration a plugin queued on window before the bundle loaded', () => {
		queueHolder.jetpackFormsIntegrations = [ [ 'acme/slack', { buildCard } ] ];

		expect( getFormsIntegration( 'acme/slack' )?.buildCard ).toBe( buildCard );
	} );

	it( 'picks up a registration made after the registry was first read', () => {
		expect( getFormsIntegration( 'acme/slack' ) ).toBeUndefined();

		registerFormsIntegration( 'acme/slack', { buildCard } );

		expect( getFormsIntegration( 'acme/slack' )?.buildCard ).toBe( buildCard );
	} );

	it( 'lets a later registration for the same slug replace an earlier one', () => {
		const replacement = () => ( { id: 'acme/slack', title: 'Replaced', description: '' } );

		registerFormsIntegration( 'acme/slack', { buildCard } );
		registerFormsIntegration( 'acme/slack', { buildCard: replacement } );

		expect( getFormsIntegration( 'acme/slack' )?.buildCard ).toBe( replacement );
	} );

	it( 'skips malformed queue entries without dropping valid ones', () => {
		queueHolder.jetpackFormsIntegrations = [
			'not-an-entry',
			[ 42, { buildCard } ],
			[ '', { buildCard } ],
			[ 'acme/null', null ],
			[ 'acme/slack', { buildCard } ],
		];

		expect( Object.keys( getFormsIntegrations() ) ).toEqual( [ 'acme/slack' ] );
	} );
} );
