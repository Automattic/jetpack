import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import styles from '../health.module.scss';

const cacheIssuesLink = 'TBD'; // @todo - add proper link here.

const messages: { [ key: string ]: { title: string; message: React.ReactNode } } = {
	'feature-disabled-advanced-cache-incompatible': {
		title: __( 'Cache loader script already exists', 'jetpack-boost' ),
		message: createInterpolateElement(
			sprintf(
				// translators: %d refers to the number of milliseconds users are saving by using Super Cache.
				__(
					`This feature cannot be enabled because <file>%s</file> was found on your site. It was created by another plugin, or your hosting provider. Please remove it to use this module. <link>Learn more.</link>`,
					'jetpack-boost'
				),
				'wp-content/advanced-cache.php'
			),
			{
				file: <span className={ styles.underline } />,
				// eslint-disable-next-line jsx-a11y/anchor-has-content
				link: <a href={ cacheIssuesLink } target="_blank" rel="noopener noreferrer" />,
			}
		),
	},
};

export const getDiagnosticData = ( status: string ) => {
	return messages[ status ] || null;
};
