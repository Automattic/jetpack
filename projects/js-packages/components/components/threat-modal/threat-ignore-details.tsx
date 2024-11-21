import { Text, Button, getRedirectUrl } from '@automattic/jetpack-components';
import { type Threat } from '@automattic/jetpack-scan';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

const ThreatIgnoreDetails = ( { threat }: { threat: Threat } ) => {
	if ( ! threat?.status || [ 'ignored', 'fixed' ].includes( threat.status ) ) {
		return null;
	}

	const codeableURL = getRedirectUrl( 'jetpack-protect-codeable-referral' );

	return (
		<div className={ styles.section }>
			<Text variant="title-small">
				{ __( 'Do you really want to ignore this threat?', 'jetpack' ) }
			</Text>
			<Text>
				{ /* TODO: Ensure we only direct supported site to Codeable */ }
				{ createInterpolateElement(
					__(
						'By choosing to ignore this threat, you acknowledge that you have reviewed the detected code. You are accepting the risks of maintaining a potentially malicious or vulnerable file on your site. If you are unsure, please request an estimate with <codeableLink>Codeable</codeableLink>.',
						'jetpack'
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
