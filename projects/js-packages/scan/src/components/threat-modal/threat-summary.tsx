import { Button, Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useContext } from 'react';
import styles from './styles.module.scss';
import { ThreatModalContext } from './index.js';

/**
 * ThreatSummary component
 *
 * @return {JSX.Element} The rendered threat summary.
 */
const ThreatSummary = (): JSX.Element => {
	const { threat } = useContext( ThreatModalContext );

	return (
		<div className={ styles.section }>
			{ !! threat.description && <Text>{ threat.description }</Text> }
			{ !! threat.source && (
				<div>
					<Button variant="link" isExternalLink={ true } weight="regular" href={ threat.source }>
						{ __( 'See more technical details of this threat', 'jetpack-scan' ) }
					</Button>
				</div>
			) }
		</div>
	);
};

export default ThreatSummary;
