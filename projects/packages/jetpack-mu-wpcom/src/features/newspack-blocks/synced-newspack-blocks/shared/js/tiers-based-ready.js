/**
 * The readiness handshake between the tiers-based Donate view script and the
 * modal checkout's donate URL trigger. The two sides live in separate webpack
 * bundles (tiersBased and modal) that load async in either order, so the
 * constants live here rather than in either bundle's own module: the view
 * script stamps the attribute and dispatches the event once its listeners are
 * attached; the trigger resolver reads the attribute and retries on the event.
 */

/**
 * Bubbling event the tiers-based view script dispatches on its container once
 * its listeners are attached (right after it sets the readiness attribute).
 * A trigger that resolved a block as `not-ready` listens for this to retry.
 *
 * @type {string}
 */
export const TIERS_BASED_READY_EVENT = 'newspack-tiers-based-ready';

/**
 * Attribute the tiers-based view script stamps on its container when it
 * initializes — the other half of the readiness handshake announced by
 * TIERS_BASED_READY_EVENT.
 *
 * @type {string}
 */
export const TIERS_BASED_READY_ATTRIBUTE = 'data-tiers-based-ready';
