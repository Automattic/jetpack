import { ThreatsContext } from '@automattic/jetpack-scan';
import { Modal } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useContext } from 'react';
import ContextualUpgradeTrigger from '../../contextual-upgrade-trigger';
import Text from '../../text';
import ThemeProvider from '../../theme-provider';
import styles from '../styles.module.scss';
import ThreatDetailsModalActions from './actions';
import ThreatDetailsModalTechnicalDetails from './technical-details';
import ThreatDetailsModalTitle from './title';

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
			<Modal title={ <ThreatDetailsModalTitle /> } { ...props }>
				<div className={ styles[ 'threat-modal__content' ] }>
					<div className={ styles[ 'threat-modal__section' ] }>
						{ !! threat.title && (
							<Text className={ styles[ 'threat-modal__section__title' ] }>{ threat.title }</Text>
						) }

						{ !! threat.description && <Text>{ threat.description }</Text> }

						{ ! threat.fixable && (
							<>
								<Text className={ styles[ 'threat-modal__section__title' ] }>
									{ __( 'How to fix it?', 'jetpack-components' ) }
								</Text>
								{ threat.fixedIn ? (
									<Text>
										{ sprintf(
											/* translators: Translates to Updates to version. %1$s: Name. %2$s: Fixed version */
											__( 'Update %1$s to version %2$s.', 'jetpack-components' ),
											threat.extension.name,
											threat.fixedIn
										) }
									</Text>
								) : (
									<Text>
										{ __(
											'Jetpack cannot automatically fix this threat. We suggest that you resolve the threat manually: ensure that WordPress, your theme, and all of your plugins are up to date, and remove the offending code, theme, or plugin from your site.',
											'jetpack-components'
										) }
									</Text>
								) }
							</>
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
