import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import styles from '../health.module.scss';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { PageCacheError } from '$lib/stores/page-cache';

const cacheIssuesLink = ( issue: string ) => {
	return getRedirectUrl( `jetpack-boost-cache-issue-${ issue }` );
};

const messages: { [ key: string ]: { title: string; message: React.ReactNode } } = {
	'failed-settings-write': {
		title: __( 'The settings file cannot be updated', 'jetpack-boost' ),
		message: createInterpolateElement(
			__(
				`This feature cannot be enabled because Jetpack Boost cannot update its settings. To learn more about this, please <link>click here.</link>`,
				'jetpack-boost'
			),
			{
				link: (
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						href={ cacheIssuesLink( 'failed-settings-write' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		),
	},
	'wp-content-not-writable': {
		title: sprintf(
			// translators: %s refers to wp-content.
			__( `Your site's %s folder doesn't allow updates`, 'jetpack-boost' ),
			'wp-content'
		),
		message: createInterpolateElement(
			sprintf(
				// translators: %s refers to wp-content.
				__(
					`This feature cannot be enabled because Jetpack Boost cannot create or modify files in <code>%s</code>. To learn more about this, please <link>click here.</link>`,
					'jetpack-boost'
				),
				'wp-content'
			),
			{
				code: <code className={ styles.nowrap } />,
				link: (
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						href={ cacheIssuesLink( 'wp-content-not-writable' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		),
	},
	'not-using-permalinks': {
		title: __( 'Permalink settings must be updated', 'jetpack-boost' ),
		message: createInterpolateElement(
			__(
				'To activate this feature, your site needs to use a different URL structure instead of the current Plain (default) permalinks. To learn more, please <link>please click here.</link>',
				'jetpack-boost'
			),
			{
				link: (
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						href={ cacheIssuesLink( 'not-using-permalinks' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		),
	},
	'advanced-cache-incompatible': {
		title: __( 'Existing Cache System Detected', 'jetpack-boost' ),
		message: createInterpolateElement(
			__(
				`This feature cannot be enabled because your site is already using a caching system, installed by another plugin or your hosting provider. For a unified optimization experience with Jetpack Boost, please deactivate the current caching solution by disabling the plugin or contacting your hosting support for assistance. If you already did that, try enabling caching again. <link>Learn More.</link>`,
				'jetpack-boost'
			),
			{
				link: (
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						href={ cacheIssuesLink( 'advanced-cache-incompatible' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		),
	},
	'advanced-cache-for-super-cache': {
		title: __( 'Existing Cache System Detected', 'jetpack-boost' ),
		message: createInterpolateElement(
			__(
				`WP Super Cache has been detected on your site. That plugin must be deactivated before the caching feature in Jetpack Boost can be activated. To learn more, <link>click here.</link>`,
				'jetpack-boost'
			),
			{
				code: <code className={ styles.nowrap } />,
				link: (
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						href={ cacheIssuesLink( 'advanced-cache-for-super-cache' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		),
	},
	'unable-to-write-to-advanced-cache': {
		title: __( 'File Update Needed for Activation', 'jetpack-boost' ),
		message: createInterpolateElement(
			__(
				`Jetpack Boost cannot activate this feature because it does not have permission to update a necessary file on your site. To learn more, please <link>click here.</link>`,
				'jetpack-boost'
			),
			{
				link: (
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						href={ cacheIssuesLink( 'unable-to-write-to-advanced-cache' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		),
	},
	'wp-cache-defined-not-true': {
		title: __( 'The WordPress cache constant must be updated', 'jetpack-boost' ),
		message: createInterpolateElement(
			sprintf(
				// translators: %1$s refers to the cache constant (WP_CACHE). %2$s refers to what it isn't set to (true).
				__(
					`Jetpack Boost needs a specific setting to be activated for caching to work properly. Currently, the setting named <code>%1$s</code> is not correctly configured on your site. It should be set to <code>%2$s</code> to enable caching. <link>Click here for easy instructions on how to fix this.</link>`,
					'jetpack-boost'
				),
				'WP_CACHE',
				'true'
			),
			{
				code: <code className={ styles.nowrap } />,
				link: (
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						href={ cacheIssuesLink( 'wp-cache-defined-not-true' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		),
	},
	'page-cache-root-dir-not-writable': {
		title: __( 'Cannot create files in cache directory', 'jetpack-boost' ),
		message: createInterpolateElement(
			sprintf(
				// translators: %s refers to the cache directory.
				__(
					`Jetpack Boost can't enable caching because it doesn't have permission to write to the cache directory at <code>%s</code>. To fix this, the directory needs to be made writable. This change is necessary for caching to work and speed up your site.`,
					'jetpack-boost'
				),
				'wp-content/boost-cache'
			),
			{
				code: <code className={ styles.nowrap } />,
			}
		),
	},
	'wp-config-not-writable': {
		title: __( 'The configuration file cannot be updated', 'jetpack-boost' ),
		message: createInterpolateElement(
			sprintf(
				// translators: %s refers to wp-config.php.
				__(
					`The configuration file, <code>%s</code>, is not writable. This file must be writable to activate caching. For instructions on how to make this change, <link>please click here.</link>`,
					'jetpack-boost'
				),
				'wp-config.php'
			),
			{
				code: <code className={ styles.nowrap } />,
				link: (
					// eslint-disable-next-line jsx-a11y/anchor-has-content
					<a
						href={ cacheIssuesLink( 'wp-config-not-writable' ) }
						target="_blank"
						rel="noopener noreferrer"
					/>
				),
			}
		),
	},
};

type FormattedError = {
	title: string;
	message: React.ReactNode;
};
function getErrorData( status?: PageCacheError ): false | FormattedError {
	if ( ! status ) {
		return false;
	}

	// Try to find a message based on status code
	const code = typeof status === 'string' ? status : status.code;
	if ( code in messages ) {
		return messages[ code ];
	}

	// Unrecognized error code:
	let title = __( 'Unknown error', 'jetpack-boost' );
	if ( status.code && status.code !== status.message ) {
		title += ` (${ status.code })`;
	}
	return {
		title,
		message: status.message,
	};
}

export default getErrorData;
