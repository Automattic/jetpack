/**
 * Registers the cards for the integrations that ship with Jetpack Forms.
 *
 * These go through the same public registry a plugin would use. If a bundled card needed
 * something the registry cannot express, that would be a gap in the registry rather than a
 * reason to special-case it here.
 */

import { registerFormsIntegration } from '../../../../../integrations/registry.ts';
import { buildAkismetCard } from './akismet.tsx';
import { buildGoogleDriveCard } from './google-drive.tsx';
import { buildHostingerReachCard } from './hostinger-reach.tsx';
import { buildJetpackCrmCard } from './jetpack-crm.tsx';
import { buildMailPoetCard } from './mailpoet.tsx';
import { buildSalesforceCard } from './salesforce.tsx';
import { buildSlackCard, SLACK_SLUG } from './slack.tsx';

let registered = false;

/**
 * Register every bundled integration card. Calling this more than once is a no-op.
 */
export function registerBuiltInIntegrations(): void {
	if ( registered ) {
		return;
	}
	registered = true;

	registerFormsIntegration( 'akismet', { buildCard: buildAkismetCard } );
	registerFormsIntegration( 'google-drive', { buildCard: buildGoogleDriveCard } );
	registerFormsIntegration( 'hostinger-reach', { buildCard: buildHostingerReachCard } );
	registerFormsIntegration( 'zero-bs-crm', { buildCard: buildJetpackCrmCard } );
	registerFormsIntegration( 'mailpoet', { buildCard: buildMailPoetCard } );
	registerFormsIntegration( 'salesforce', { buildCard: buildSalesforceCard } );
	registerFormsIntegration( SLACK_SLUG, { buildCard: buildSlackCard } );
}
