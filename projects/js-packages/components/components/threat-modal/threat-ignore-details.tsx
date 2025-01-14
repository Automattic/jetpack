import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useContext } from 'react';
import { Text, Button, getRedirectUrl } from '@automattic/jetpack-components';
import styles from './styles.module.scss';
import { ThreatModalContext } from '.';

const ThreatIgnoreDetails = () => {
	const { threat, isSupportedEnvironment } = useContext( ThreatModalContext );

	if ( ! threat?.status || [ 'ignored', 'fixed' ].includes( threat.status ) ) {
		return null;
	}

	const codeableURL = getRedirectUrl( 'jetpack-protect-codeable-referral' );

	return (
		<div className={ styles.section }>
			<Text variant="title-small">
				{ __( 'Do you really want to ignore this threat?', 'jetpack-components' ) }
			</Text>
			<Text>
				{ __(
					'By choosing to ignore this threat, you acknowledge that you have reviewed the detected code. You are accepting the risks of maintaining a potentially malicious or vulnerable file on your site.',
					'jetpack-components'
				) }{ ' ' }
				{ isSupportedEnvironment &&
					createInterpolateElement(
						__(
							'If you are unsure, please request an estimate with <codeableLink>Codeable</codeableLink>.',
							'jetpack-components'
						),
						{
							codeableLink: <Button variant="link" isExternalLink={ true } href={ codeableURL } />,
						}
					) }
			</Text>
		</div>
	);
};

export default ThreatIgnoreDetails;
