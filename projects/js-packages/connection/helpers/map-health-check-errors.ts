/**
 * Maps the output of the connection health-check endpoint
 * (`GET jetpack/v4/connection/test`) into the same `ConnectionErrorMap` shape
 * the store already uses for WPCOM-reported `connectionErrors`, so a single
 * consumer (`useConnectionErrorNotice`) can surface both identically.
 *
 * @see Connection_Health_Test_Base::output_fails_as_wp_error() for the source shape.
 */

import { __ } from '@wordpress/i18n';
import type {
	ConnectionErrorData,
	ConnectionErrorMap,
} from '../hooks/use-connection-error-notice/types';

/**
 * Prefix every genuine failed health check carries. The endpoint builds each
 * failure code as `'failed_' . $result['name']` (see
 * `Connection_Health_Test_Base::output_fails_as_wp_error()`), so this prefix is
 * what distinguishes an actual connection-health failure from a transport,
 * permission, or routing error that `apiFetch` surfaces with the same
 * `{ code, message, data }` shape (e.g. `fetch_error` when the admin browser is
 * offline, `invalid_user_permission_manage_options` on a 401, `rest_no_route`
 * on older sites). Those are not broken-connection states and must not be
 * re-skinned as connection banners.
 */
const FAILED_CHECK_PREFIX = 'failed_';

/**
 * A single failed check, normalized from the REST-serialized WP_Error body.
 */
interface FailedCheck {
	code: string;
	message: string;
	data: Record< string, unknown >;
}

/**
 * The REST-serialized WP_Error body returned by the health-check endpoint: the
 * primary failure at the top level, the rest under `additional_errors`.
 */
interface HealthCheckErrorBody {
	code?: string;
	message?: string;
	data?: Record< string, unknown >;
	additional_errors?: Array< {
		code?: string;
		message?: string;
		data?: Record< string, unknown >;
	} >;
}

/**
 * Parse a health check's `resolution` string into a structured action.
 *
 * The endpoint encodes a failed check's call-to-action as a single string:
 * `"<action_label> :<action_url>"` (see `output_fails_as_wp_error()`), which is
 * fragile to consume. We split it back into fields here.
 *
 * @param resolution - The raw `resolution` value from the check's error data.
 * @return Structured action data (may be empty).
 */
function parseResolution( resolution: unknown ): ConnectionErrorData {
	if ( ! resolution || typeof resolution !== 'string' ) {
		return {};
	}

	const separatorIndex = resolution.indexOf( ' :' );
	if ( separatorIndex === -1 ) {
		return {};
	}

	const actionLabel = resolution.slice( 0, separatorIndex ).trim();
	const actionUrl = resolution.slice( separatorIndex + 2 ).trim();

	const data: ConnectionErrorData = {};
	if ( actionUrl ) {
		data.action_url = actionUrl;
	}
	if ( actionLabel ) {
		data.action_label = actionLabel;
	}
	return data;
}

/**
 * Flatten a REST-serialized WP_Error body into a list of individual checks.
 *
 * @param body - The parsed error response body.
 * @return The failed checks, primary first.
 */
function flattenFailedChecks( body: unknown ): FailedCheck[] {
	if ( ! body || typeof body !== 'object' ) {
		return [];
	}

	const typedBody = body as HealthCheckErrorBody;
	if ( ! typedBody.code ) {
		return [];
	}

	const primary: FailedCheck = {
		code: typedBody.code,
		message: typedBody.message ?? '',
		data: typedBody.data || {},
	};

	const additional: FailedCheck[] = (
		Array.isArray( typedBody.additional_errors ) ? typedBody.additional_errors : []
	).map( error => ( {
		code: error.code ?? '',
		message: error.message ?? '',
		data: error.data || {},
	} ) );

	return [ primary, ...additional ];
}

/**
 * Map the health-check endpoint's failure response to a `ConnectionErrorMap`.
 *
 * @param body - The parsed error response body from `jetpack/v4/connection/test`.
 * @return The mapped errors, keyed by check code.
 */
export default function mapHealthCheckErrors( body: unknown ): ConnectionErrorMap {
	const errorMap: ConnectionErrorMap = {};

	for ( const check of flattenFailedChecks( body ) ) {
		// Only genuine health-check failures are mapped to connection banners.
		if ( ! check.code.startsWith( FAILED_CHECK_PREFIX ) ) {
			continue;
		}

		errorMap[ check.code ] = {
			// Health checks are not user-scoped; key under '0' to mirror the
			// blog-token convention of the stored connectionErrors shape.
			0: {
				error_code: check.code,
				// Fall back to a generic message so a failed check with no message
				// still surfaces.
				error_message: check.message || __( 'A connection check failed.', 'jetpack-connection-js' ),
				error_type: 'connection_health',
				error_data: parseResolution( check.data.resolution ),
			},
		};
	}

	return errorMap;
}
