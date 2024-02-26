import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import styles from '../health.module.scss';
import { getRedirectUrl } from '@automattic/jetpack-components';

const cacheIssuesLink = ( issue: string ) => {
	return getRedirectUrl( `jb-cache-issue-${ issue }` );
};

const messages: { [ key: string ]: { title: string; message: React.ReactNode } } = {
	'wp-content-not-writable': {
		title: 'wp-content not writable',
		message: createInterpolateElement(
			sprintf(
				// translators: %s refers to wp-content.
				__(
					`This feature cannot be enabled because <code>%s</code> is not writable. <link>Learn more.</link>`,
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
		title: __( 'Your site is using Plain Permalinks', 'jetpack-boost' ),
		message: createInterpolateElement(
			__(
				'This feature cannot be enabled because your site is using Plain Permalinks. Please switch to a different permalink structure in order to use the Page Cache. <link>Learn more.</link>',
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
		title: __( 'Cache loader file already exists', 'jetpack-boost' ),
		message: createInterpolateElement(
			sprintf(
				// translators: %s refers to the path of the cache loader file.
				__(
					`This feature cannot be enabled because <code>%s</code> was found on your site. It was created by another plugin, or your hosting provider. Please remove it to use this module. <link>Learn more.</link>`,
					'jetpack-boost'
				),
				'wp-content/advanced-cache.php'
			),
			{
				code: <code className={ styles.nowrap } />,
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
	'unable-to-write-to-advanced-cache': {
		title: __( 'Could not write to cache loader file', 'jetpack-boost' ),
		message: createInterpolateElement(
			sprintf(
				// translators: %s refers to the path of the cache loader file.
				__(
					`This feature cannot be enabled because <code>%s</code> is not writable. <link>Learn more.</link>`,
					'jetpack-boost'
				),
				'wp-content/advanced-cache.php'
			),
			{
				code: <code className={ styles.nowrap } />,
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
		title: __( 'Cache constant not set to true', 'jetpack-boost' ),
		message: createInterpolateElement(
			sprintf(
				// translators: %1$s refers to the cache constant (WP_CACHE), %2$s refers to what it isn't set to (true), %3$s refers to what the value should be set to (true).
				__(
					`<code>%1$s</code> has already been defined, but is not set to <code>%2$s</code>. To use caching, it needs to be set to <code>%3$s</code>. <link>Learn more.</link>`,
					'jetpack-boost'
				),
				'WP_CACHE',
				'true',
				'true',
				'wp-content/advanced-cache.php'
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
		title: __( 'Cache directory is not writable', 'jetpack-boost' ),
		message: createInterpolateElement(
			sprintf(
				// translators: %d refers to the path of the cache directory.
				__(
					`This feature cannot be enabled because the cache directory (<code>%s</code>) is not writable. This needs to be resolved before caching can be enabled.`,
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
		title: __( 'wp-config.php not writable', 'jetpack-boost' ),
		message: createInterpolateElement(
			sprintf(
				// translators: %d refers to the path of wp-config.php.
				__(
					`This feature cannot be enabled because <code>%s</code> is not writable. This needs to be resolved before caching can be enabled.`,
					'jetpack-boost'
				),
				'wp-config.php'
			),
			{
				code: <code className={ styles.nowrap } />,
			}
		),
	},
};

export default ( status: string ) => {
	if ( status in messages ) {
		return messages[ status ];
	}
	return {
		title: __( 'Unknown error', 'jetpack-boost' ),
		message: status,
	};
};
