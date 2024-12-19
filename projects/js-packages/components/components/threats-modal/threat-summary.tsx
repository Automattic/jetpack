import { type Threat } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { Button } from '@automattic/jetpack-components';
import Text from '../text';
import styles from './styles.module.scss';

/**
 * ThreatSummary component
 *
 * @param {object} props        - The props.
 * @param {Threat} props.threat - The threat.
 *
 * @return {JSX.Element} The rendered threat summary.
 */
const ThreatSummary = ( { threat }: { threat: Threat } ): JSX.Element => {
	return (
		<div className={ styles.section }>
			{ !! threat.description && <Text>{ threat.description }</Text> }
			{ !! threat.source && (
				<div>
					<Button variant="link" isExternalLink={ true } weight="regular" href={ threat.source }>
						{ __( 'See more technical details of this threat', 'jetpack-components' ) }
					</Button>
				</div>
			) }
		</div>
	);
};

export default ThreatSummary;
