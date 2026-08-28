/**
 * `@wordpress/private-apis`, plus the Core modules of the WordPress versions this polyfill
 * replaces it on. Upstream drops a module from the allowlist once its own copy stops opting in,
 * but the copy those Core versions ship still does, and it loads against this script.
 */

// Relative path: the package's `exports` map hides the implementation module.
import { allowCoreModule } from '../../node_modules/@wordpress/private-apis/build-module/implementation.mjs';

export * from '@wordpress/private-apis';

// Removed in 1.54.0 (DataViews 18.1 no longer opts in); WordPress 7.0's DataViews still does.
allowCoreModule( '@wordpress/dataviews' );
