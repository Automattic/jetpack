import { getMyJetpackUrl, getScriptData } from '@automattic/jetpack-script-data';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { hasSocialPaidFeatures } from '../../../utils';
import Logo from './logo';
import styles from './styles.module.scss';

/**
 * @type {Array<import('@automattic/jetpack-script-data').AdminSiteData['host']>}
 */
const HIDE_LICENSE_UI_FOR = [ 'woa', 'atomic', 'newspack', 'vip', 'wpcom' ];

const AdminPageHeader = () => {
	const showLicenceUi = ! HIDE_LICENSE_UI_FOR.includes( getScriptData().site.host );

	return (
		<div className={ styles.header }>
			<span className={ styles.logo }>
				<Logo />
			</span>

			{ ! hasSocialPaidFeatures() && showLicenceUi && (
				<p>
					{ createInterpolateElement(
						__(
							'Already have an existing plan or license key? <a>Click here to get started</a>',
							'jetpack-publicize-components'
						),
						{
							a: <a href={ getMyJetpackUrl( '#/add-license' ) } />,
						}
					) }
				</p>
			) }
		</div>
	);
};

export default AdminPageHeader;
