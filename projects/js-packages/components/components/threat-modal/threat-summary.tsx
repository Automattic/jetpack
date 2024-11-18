import { Button } from '@automattic/jetpack-components';
import { type Threat } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import Text from '../text';
import ThreatSeverityBadge from '../threat-severity-badge';
import styles from './styles.module.scss';

const ThreatSummary = ( { threat, title }: { threat: Threat; title: string } ): JSX.Element => (
	<div className={ styles.section }>
		<div className={ styles.title }>
			<Text variant="title-small">{ title }</Text>
			{ !! threat.severity && <ThreatSeverityBadge severity={ threat.severity } /> }
		</div>
		{ !! threat.description && <Text>{ threat.description }</Text> }
		{ !! threat.source && (
			<div>
				<Button variant="link" isExternalLink={ true } weight="regular" href={ threat.source }>
					{ __( 'See more technical details of this threat', 'jetpack' ) }
				</Button>
			</div>
		) }
	</div>
);

export default ThreatSummary;
