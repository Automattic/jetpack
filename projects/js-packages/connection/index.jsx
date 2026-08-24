/*
This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, see <https://www.gnu.org/licenses/>.
*/

// Ensure that module augmentation is applied
export {} from './declarations.d.ts';

/**
 * Components.
 */
export { default as ConnectScreen } from './components/connect-screen/basic';
export { default as ConnectScreenLayout } from './components/connect-screen/layout';
export { default as ConnectScreenRequiredPlan } from './components/connect-screen/required-plan';
export { default as ConnectButton } from './components/connect-button';
export { default as ConnectionErrorNotice } from './components/connection-error-notice';
export { default as ConnectionErrorSupportLink } from './components/connection-error-support-link';
export { ConnectionError } from './hooks/use-connection-error-notice';
export { default as DisconnectDialog } from './components/disconnect-dialog';
export { default as DisconnectCard } from './components/disconnect-card';
export { default as useConnection } from './components/use-connection';
export { default as ManageConnectionDialog } from './components/manage-connection-dialog';

/**
 * Helpers.
 */
export { default as thirdPartyCookiesFallbackHelper } from './helpers/third-party-cookies-fallback';
export { default as getCalypsoOrigin } from './helpers/get-calypso-origin';
export * from './helpers/get-user-connection-url.ts';
export { getReconnectErrorMessage } from './helpers/get-reconnect-error-message.ts';

/**
 * Store
 */
export { STORE_ID as CONNECTION_STORE_ID } from './state/store';

/**
 * Hooks
 */
export { default as useProductCheckoutWorkflow } from './hooks/use-product-checkout-workflow';
export { default as useRestoreConnection } from './hooks/use-restore-connection';
export { default as useConnectionErrorNotice } from './hooks/use-connection-error-notice';
export {
	isOtherUsersConnectionError,
	getConnectionErrorUserScope,
} from './hooks/use-connection-error-notice/viewer-scope';

/**
 * Connection-error presentation. The notice copy lives here so every consumer
 * describes the same error the same way; `getConnectionErrorDetails` is the one
 * consumers with their own notice system need, the rest are its parts.
 */
export * from './hooks/use-connection-error-notice/error-details.ts';

/**
 * Public type contract for connection-error consumers. Forwarded via `export *`
 * (not `export type`, which is invalid in this `.jsx` barrel) — type-only, so no
 * runtime effect. Mirrors the existing `get-user-connection-url` re-export.
 */
export * from './hooks/use-connection-error-notice/types.ts';
