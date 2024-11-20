import { Threat } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import DiffViewer from '../diff-viewer';
import MarkedLines from '../marked-lines';
import Text from '../text';
import styles from './styles.module.scss';

/**
 * ThreatTechnicalDetails component
 *
 * @param {object} props        - The component props.
 * @param {object} props.threat - The threat object containing technical details.
 *
 * @return {JSX.Element | null} The rendered technical details or null if no details are available.
 */
const ThreatTechnicalDetails = ( { threat }: { threat: Threat } ): JSX.Element => {
	if ( ! threat.filename && ! threat.context && ! threat.diff ) {
		return null;
	}

	return (
		<div className={ styles.section }>
			<Text variant="title-small">{ __( 'The technical details', 'jetpack' ) }</Text>
			{ threat.filename && (
				<>
					<Text>{ __( 'Threat found in file:', 'jetpack' ) }</Text>
					<pre className={ styles.filename }>{ threat.filename }</pre>
				</>
			) }
			{ threat.context && <MarkedLines context={ threat.context } /> }
			{ threat.diff && <DiffViewer diff={ threat.diff } /> }
		</div>
	);
};

export default ThreatTechnicalDetails;
