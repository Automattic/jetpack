import { Notice } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useSingleModuleState } from '$features/module/lib/stores';
import styles from './health.module.scss';

const Health = () => {
	const [ pageCache ] = useSingleModuleState( 'page_cache' );
	const cacheIssuesLink = 'TBD';

	return (
		pageCache?.active !== true && (
			<Notice
				level="warning"
				hideCloseButton={ true }
				title={ __( 'Cache loader script already exists', 'jetpack-boost' ) }
			>
				{ createInterpolateElement(
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
				) }
			</Notice>
		)
	);
};

export default Health;
