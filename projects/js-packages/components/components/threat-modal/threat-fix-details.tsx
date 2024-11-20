import { Threat, getFixerMessage } from '@automattic/jetpack-scan';
import { __, sprintf } from '@wordpress/i18n';
import React, { useMemo } from 'react';
import ContextualUpgradeTrigger from '../contextual-upgrade-trigger';
import Text from '../text';
import styles from './styles.module.scss';

/**
 * ThreatFixDetails component
 *
 * @param {object}   props                    - The component props.
 * @param {object}   props.threat             - The threat object containing fix details.
 * @param {Function} props.handleUpgradeClick - Function to handle upgrade click events.
 *
 * @return {JSX.Element | null} The rendered fix details or null if no fixable details are available.
 */
const ThreatFixDetails = ( {
	threat,
	handleUpgradeClick,
}: {
	threat: Threat;
	handleUpgradeClick: () => void;
} ): JSX.Element => {
	const title = useMemo( () => {
		if ( threat.status === 'fixed' ) {
			return __( 'How did Jetpack fix it?', 'jetpack' );
		}
		if ( threat.status === 'current' && threat.fixable ) {
			return __( 'How can Jetpack auto-fix this threat?', 'jetpack' );
		}
		return __( 'How to fix it?', 'jetpack' );
	}, [ threat ] );

	const fix = useMemo( () => {
		// The threat has a fixed version available, but no auto-fix is available.
		// The user needs to update the extension to the fixed version.
		if ( ! threat.fixable && threat.fixedIn ) {
			return sprintf(
				/* translators: Translates to Updates to version. %1$s: Name. %2$s: Fixed version */
				__( 'Update %1$s to version %2$s.', 'jetpack' ),
				threat.extension.name,
				threat.fixedIn
			);
		}
		// The threat has an auto-fix available.
		return getFixerMessage( threat );
	}, [ threat ] );

	if ( ! threat.fixable && ! threat.fixedIn ) {
		return null;
	}

	return (
		<div className={ styles.section }>
			<Text variant="title-small">{ title }</Text>
			<Text>{ fix }</Text>
			{ handleUpgradeClick && (
				<ContextualUpgradeTrigger
					description={ __( 'Looking for advanced scan results and one-click fixes?', 'jetpack' ) }
					cta={ __( 'Upgrade Jetpack now', 'jetpack' ) }
					onClick={ handleUpgradeClick }
				/>
			) }
		</div>
	);
};

export default ThreatFixDetails;
