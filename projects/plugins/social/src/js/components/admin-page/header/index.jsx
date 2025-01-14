import { hasSocialPaidFeatures } from '@automattic/jetpack-publicize-components';
import { getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Logo from './../../logo';
import styles from './styles.module.scss';

const AdminPageHeader = () => {
	const activateLicenseUrl = getMyJetpackUrl( '#/add-license' );

	return (
		<div className={ styles.header }>
			<span className={ styles.logo }>
				<Logo />
			</span>

			{ ! hasSocialPaidFeatures() && (
				<p>
					{ createInterpolateElement(
						__(
							'Already have an existing plan or license key? <a>Click here to get started</a>',
							'jetpack-social'
						),
						{
							a: <a href={ activateLicenseUrl } />,
						}
					) }
				</p>
			) }
		</div>
	);
};

export default AdminPageHeader;
