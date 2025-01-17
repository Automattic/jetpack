import { Threat, ThreatsContext } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useContext } from 'react';
import Button from '../../button';
import ContextualUpgradeTrigger from '../../contextual-upgrade-trigger';
import Text from '../../text';
import ThemeProvider from '../../theme-provider';
import ThreatSeverityBadge from '../../threat-severity-badge';
import styles from '../styles.module.scss';
import ThreatDetailsModalActions from './actions';
import ThreatDetailsModalTechnicalDetails from './technical-details';

const ThreatDetailsModalTitle = ( { threat }: { threat: Threat } ) => {
	let title: string;
	switch ( threat.status ) {
		case 'ignored':
			title = __( 'Ignored Threat', 'jetpack-components' );
			break;
		case 'fixed':
			title = __( 'Fixed Threat', 'jetpack-components' );
			break;
		case 'current':
		default:
			title = __( 'Active Threat', 'jetpack-components' );
			break;
	}

	return (
		<div className={ styles[ 'threat-modal__title' ] }>
			{ title }
			{ !! threat.severity && threat.status === 'current' && (
				<ThreatSeverityBadge severity={ threat.severity } showLabel />
			) }
		</div>
	);
};

/**
 * ThreatDetailsModal component
 *
 * @param {object} props - The modal props.
 *
 * @return {JSX.Element} The rendered fix confirmation.
 */
const ThreatDetailsModal = props => {
	const { selectedThreat: threat, upgradePlan } = useContext( ThreatsContext );

	return (
		<ThemeProvider>
			<Modal title={ <ThreatDetailsModalTitle threat={ threat } /> } { ...props }>
				<div className={ styles[ 'threat-modal__content' ] }>
					<div className={ styles[ 'threat-modal__section' ] }>
						{ !! threat.title && (
							<Text className={ styles[ 'threat-modal__section__title' ] }>{ threat.title }</Text>
						) }

						{ !! threat.description && <Text>{ threat.description }</Text> }

						{ !! threat.source && (
							<div>
								<Button
									variant="link"
									isExternalLink={ true }
									weight="regular"
									href={ threat.source }
								>
									{ __( 'See more technical details of this threat', 'jetpack-components' ) }
								</Button>
							</div>
						) }
					</div>
					<ThreatDetailsModalTechnicalDetails />
				</div>
				<div className={ styles[ 'threat-modal__footer' ] }>
					<div className={ styles[ 'threat-modal__footer__actions' ] }>
						<ThreatDetailsModalActions />
					</div>
					{ upgradePlan && (
						<ContextualUpgradeTrigger
							description={ __(
								'Looking for advanced scan results and one-click fixes?',
								'jetpack-components'
							) }
							cta={ __( 'Upgrade Jetpack now', 'jetpack-components' ) }
							onClick={ upgradePlan }
						/>
					) }
				</div>
			</Modal>
		</ThemeProvider>
	);
};

export default ThreatDetailsModal;
