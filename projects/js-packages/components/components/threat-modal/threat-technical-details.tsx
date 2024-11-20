import { Text, Button } from '@automattic/jetpack-components';
import { Threat } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { useState, useCallback } from 'react';
import DiffViewer from '../diff-viewer';
import MarkedLines from '../marked-lines';
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
	const [ open, setOpen ] = useState( false );

	const toggleOpen = useCallback( () => {
		setOpen( ! open );
	}, [ open ] );

	if ( ! threat.filename && ! threat.context && ! threat.diff ) {
		return null;
	}

	return (
		<div className={ styles.section }>
			<div className={ styles.section__title }>
				<Text variant="title-small">{ __( 'The technical details', 'jetpack' ) }</Text>
				<Button
					variant="icon"
					className={ styles.section__toggle }
					icon={ open ? chevronUp : chevronDown }
					aria-expanded={ open }
					onClick={ toggleOpen }
				/>
			</div>
			<div className={ open ? styles.section__open : styles.section__closed }>
				{ threat.filename && (
					<>
						<Text>{ __( 'Threat found in file:', 'jetpack' ) }</Text>
						<pre className={ styles.filename }>{ threat.filename }</pre>
					</>
				) }
				{ threat.context && <MarkedLines context={ threat.context } /> }
				{ threat.diff && <DiffViewer diff={ threat.diff } /> }
			</div>
		</div>
	);
};

export default ThreatTechnicalDetails;
