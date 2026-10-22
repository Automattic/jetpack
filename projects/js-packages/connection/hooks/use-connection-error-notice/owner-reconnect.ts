import type { ConnectionErrorObject } from './types.ts';

/**
 * Whether the errors on screen offer to reconnect the connection owner's account.
 *
 * An owner error with action `none` is informational: ownership is locked for this viewer.
 *
 * @param {ConnectionErrorObject[]} errors - The errors this viewer is being shown.
 * @return {boolean} True when an owner error carries a CTA.
 */
export function offersOwnerReconnect( errors: ConnectionErrorObject[] ): boolean {
	return errors.some( error => error.audience === 'owner' && error.error_data?.action !== 'none' );
}
