/**
 * Client-side registry of Jetpack Forms integration UI.
 *
 * The integrations modal renders React cards from a bundle that ships inside this package, so
 * a plugin cannot add a card by importing anything. Instead, registrations are pushed onto a
 * queue on `window` and drained the first time the registry is read.
 *
 * Going through a queue rather than a function on `window` is what makes registration
 * order-independent: a plugin script can register before or after the Forms bundle has loaded
 * and neither has to know about the other. That matters because the two surfaces load
 * differently — the block editor enqueues a classic script, while the wp-build dashboard is a
 * deferred script module that runs after every classic script on the page.
 */

import type {
	CardBuilderProps,
	CardItem,
} from '../blocks/contact-form/components/jetpack-integrations-modal/helpers/types.ts';

/**
 * Builds the card shown for one integration in the integrations modal.
 */
export type IntegrationCardBuilder = ( props: CardBuilderProps ) => CardItem;

/**
 * What an integration supplies to the modal.
 */
export type IntegrationDefinition = {
	/**
	 * Returns the card for this integration. Omit it to get the default card, which shows the
	 * title and description from the server with no body.
	 */
	buildCard?: IntegrationCardBuilder;
};

type QueueEntry = [ string, IntegrationDefinition ];

const QUEUE_KEY = 'jetpackFormsIntegrations';

const registry: Record< string, IntegrationDefinition > = {};

/**
 * Get the pending-registration queue, creating it if this is the first caller.
 *
 * @return The queue of registrations not yet folded into the registry.
 */
function getQueue(): QueueEntry[] {
	const holder = window as unknown as Record< string, unknown >;

	if ( ! Array.isArray( holder[ QUEUE_KEY ] ) ) {
		holder[ QUEUE_KEY ] = [];
	}

	return holder[ QUEUE_KEY ] as QueueEntry[];
}

/**
 * Fold every queued registration into the registry.
 */
function drainQueue(): void {
	const queue = getQueue();

	while ( queue.length ) {
		const entry = queue.shift();

		if ( ! Array.isArray( entry ) ) {
			continue;
		}

		const [ slug, definition ] = entry;

		if ( typeof slug === 'string' && slug && definition && typeof definition === 'object' ) {
			// A later registration for the same slug wins, so a plugin can replace a bundled card.
			registry[ slug ] = definition;
		}
	}
}

/**
 * Register the UI for an integration.
 *
 * Safe to call at any point, including before the Forms bundle has loaded. The slug must match
 * the one passed to `jetpack_forms_register_integration()` in PHP.
 *
 * A plugin that cannot import this module can push onto the same queue directly, which is
 * equivalent:
 * `( window.jetpackFormsIntegrations = window.jetpackFormsIntegrations || [] ).push( [ slug, definition ] );`
 *
 * @param slug       - Integration slug, matching the PHP registration.
 * @param definition - What this integration contributes to the modal.
 */
export function registerFormsIntegration( slug: string, definition: IntegrationDefinition ): void {
	getQueue().push( [ slug, definition ] );
}

/**
 * Get the registered UI for one integration.
 *
 * @param slug - Integration slug.
 * @return The definition, or undefined when nothing is registered for the slug.
 */
export function getFormsIntegration( slug: string ): IntegrationDefinition | undefined {
	drainQueue();

	return registry[ slug ];
}

/**
 * Get every registered integration UI, keyed by slug.
 *
 * @return The registry contents.
 */
export function getFormsIntegrations(): Record< string, IntegrationDefinition > {
	drainQueue();

	return { ...registry };
}

/**
 * Empty the registry and the queue.
 *
 * Only intended for tests.
 */
export function resetFormsIntegrations(): void {
	const holder = window as unknown as Record< string, unknown >;
	holder[ QUEUE_KEY ] = [];

	Object.keys( registry ).forEach( key => delete registry[ key ] );
}
