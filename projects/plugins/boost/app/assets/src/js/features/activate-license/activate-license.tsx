import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import styles from './activate-license.module.scss';
import { isWoaHosting } from '$lib/utils/hosting';

const ActivateLicense = () => {
	if ( isWoaHosting() ) {
		return null;
	}

	const activateLicenseUrl = 'admin.php?page=my-jetpack#/add-license';

	return (
		<p className={ styles[ 'activate-license' ] }>
			{ createInterpolateElement(
				__(
					'Already have an existing plan or license key? <link>Click here to get started</link>',
					'jetpack-boost'
				),
				{
					link: <ExternalLink className={ styles.link } href={ activateLicenseUrl } />,
				}
			) }
		</p>
	);
};

export default ActivateLicense;
