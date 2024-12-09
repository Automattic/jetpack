import { Button, getRedirectUrl, Text, ThreatSeverityBadge } from '@automattic/jetpack-components';
import { getThreatIcon, getThreatSubtitle } from '@automattic/jetpack-scan';
import { Icon } from '@wordpress/components';
import { createInterpolateElement, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useIgnoreThreatMutation from '../../data/scan/use-ignore-threat-mutation';
import useModal from '../../hooks/use-modal';
import useWafData from '../../hooks/use-waf-data';
import UserConnectionGate from '../user-connection-gate';
import styles from './styles.module.scss';

const IgnoreThreatModal = ( { threat } ) => {
	const { wafSupported } = useWafData();
	const { setModal } = useModal();
	const ignoreThreatMutation = useIgnoreThreatMutation();
	const codeableURL = getRedirectUrl( 'jetpack-protect-codeable-referral' );
	const icon = getThreatIcon( threat );

	const [ isIgnoring, setIsIgnoring ] = useState( false );

	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const handleIgnoreClick = () => {
		return async event => {
			event.preventDefault();
			setIsIgnoring( true );
			await ignoreThreatMutation.mutateAsync( threat.id );
			setModal( { type: null } );
			setIsIgnoring( false );
		};
	};

	return (
		<UserConnectionGate>
			<Text variant="title-medium" mb={ 2 }>
				{ __( 'Do you really want to ignore this threat?', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 3 }>{ __( 'Jetpack will ignore the threat:', 'jetpack-protect' ) }</Text>

			<div className={ styles.threat }>
				<Icon icon={ icon } className={ styles.threat__icon } />
				<div className={ styles.threat__summary }>
					<Text className={ styles.threat__summary__label } mb={ 1 }>
						{ getThreatSubtitle( threat ) }
					</Text>
					<Text className={ styles.threat__summary__title }>{ threat.title }</Text>
				</div>
				<div className={ styles.threat__severity }>
					<ThreatSeverityBadge severity={ threat.severity } />
				</div>
			</div>

			<Text mb={ 4 }>
				{ __(
					'By choosing to ignore this threat, you acknowledge that you have reviewed the detected code. You are accepting the risks of maintaining a potentially malicious or vulnerable file on your site.',
					'jetpack-protect'
				) }{ ' ' }
				{ wafSupported &&
					createInterpolateElement(
						__(
							'If you are unsure, please request an estimate with <codeableLink>Codeable</codeableLink>.',
							'jetpack-protect'
						),
						{
							codeableLink: <Button variant="link" isExternalLink={ true } href={ codeableURL } />,
						}
					) }
			</Text>
			<div className={ styles.footer }>
				<Button variant="secondary" onClick={ handleCancelClick() }>
					{ __( 'Cancel', 'jetpack-protect' ) }
				</Button>
				<Button isDestructive={ true } isLoading={ isIgnoring } onClick={ handleIgnoreClick() }>
					{ __( 'Ignore threat', 'jetpack-protect' ) }
				</Button>
			</div>
		</UserConnectionGate>
	);
};

export default IgnoreThreatModal;
