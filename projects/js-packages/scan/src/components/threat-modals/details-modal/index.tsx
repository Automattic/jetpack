import { ContextualUpgradeTrigger, Text, ThemeProvider } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useContext } from 'react';
import { Threat, ThreatsContext } from '@automattic/jetpack-scan';
import styles from '../styles.module.scss';
import ThreatDetailsModalActions from './actions.js';
import ThreatDetailsModalTechnicalDetails from './technical-details.js';
import ThreatDetailsModalTitle from './title.js';

/**
 * ThreatDetailsModal component
 *
 * @param {object} props        - Props to pass to the Modal component.
 * @param {Threat} props.threat - The threat to display.
 *
 * @return {JSX.Element} The rendered threat details modal.
 */
const ThreatDetailsModal = ( {
	threat,
	...props
}: {
	threat: Threat;
} & React.ComponentProps< typeof Modal > ): JSX.Element => {
	const { upgradePlan } = useContext( ThreatsContext );

	return (
		<ThemeProvider>
			<Modal title={ <ThreatDetailsModalTitle threat={ threat } /> } { ...props }>
				<div className={ styles[ 'threat-modal__content' ] }>
					<div className={ styles[ 'threat-modal__section' ] }>
						{ !! threat.title && (
							<Text className={ styles[ 'threat-modal__section__title' ] }>{ threat.title }</Text>
						) }

						{ !! threat.description && <Text>{ threat.description }</Text> }

						{ ! threat.fixable && (
							<>
								<Text className={ styles[ 'threat-modal__section__title' ] }>
									{ __( 'How to fix it?', 'jetpack-scan' ) }
								</Text>
								{ threat.fixedIn ? (
									<Text>
										{ sprintf(
											/* translators: Translates to Updates to version. %1$s: Name. %2$s: Fixed version */
											__( 'Update %1$s to version %2$s.', 'jetpack-scan' ),
											threat.extension.name,
											threat.fixedIn
										) }
									</Text>
								) : (
									<Text>
										{ __(
											'Jetpack cannot automatically fix this threat. We suggest that you resolve the threat manually: ensure that WordPress, your theme, and all of your plugins are up to date, and remove the offending code, theme, or plugin from your site.',
											'jetpack-scan'
										) }
									</Text>
								) }
							</>
						) }
					</div>
					<ThreatDetailsModalTechnicalDetails threat={ threat } />
				</div>
				<div className={ styles[ 'threat-modal__footer' ] }>
					<div className={ styles[ 'threat-modal__footer__actions' ] }>
						<ThreatDetailsModalActions threat={ threat } />
					</div>
					{ upgradePlan && (
						<ContextualUpgradeTrigger
							description={ __(
								'Looking for advanced scan results and one-click fixes?',
								'jetpack-scan'
							) }
							cta={ __( 'Upgrade Jetpack now', 'jetpack-scan' ) }
							onClick={ upgradePlan }
						/>
					) }
				</div>
			</Modal>
		</ThemeProvider>
	);
};

export default ThreatDetailsModal;
