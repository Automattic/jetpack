import { getFixerDescription } from '@automattic/jetpack-scan';
import { __, sprintf } from '@wordpress/i18n';
import React, { useMemo, useContext } from 'react';
import ContextualUpgradeTrigger from '../contextual-upgrade-trigger/index.js';
import Text from '../text/index.js';
import styles from './styles.module.scss';
import { ThreatModalContext } from './index.js';

/**
 * ThreatFixDetails component
 *
 * @return {JSX.Element | null} The rendered fix details or null if no fixable details are available.
 */
const ThreatFixDetails = (): JSX.Element => {
	const { threat, handleUpgradeClick } = useContext( ThreatModalContext );

	const title = useMemo( () => {
		if ( threat.status === 'fixed' ) {
			return __( 'How did Jetpack fix it?', 'jetpack-components' );
		}
		if ( threat.status === 'current' && threat.fixable ) {
			return __( 'How can Jetpack auto-fix this threat?', 'jetpack-components' );
		}
		return __( 'How to fix it?', 'jetpack-components' );
	}, [ threat ] );

	const fix = useMemo( () => {
		// The threat has a fixed version available, but no auto-fix is available.
		// The user needs to update the extension to the fixed version.
		if ( ! threat.fixable && threat.fixedIn ) {
			return sprintf(
				/* translators: Translates to Updates to version. %1$s: Name. %2$s: Fixed version */
				__( 'Update %1$s to version %2$s.', 'jetpack-components' ),
				threat.extension.name,
				threat.fixedIn
			);
		}

		// The threat has an auto-fix available.
		return getFixerDescription( threat );
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
					description={ __(
						'Looking for advanced scan results and one-click fixes?',
						'jetpack-components'
					) }
					cta={ __( 'Upgrade Jetpack now', 'jetpack-components' ) }
					onClick={ handleUpgradeClick }
				/>
			) }
		</div>
	);
};

export default ThreatFixDetails;
