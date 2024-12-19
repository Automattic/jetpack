import { Threat } from '@automattic/jetpack-scan';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp, Icon } from '@wordpress/icons';
import { useState, useCallback } from 'react';
import { Text, Button } from '@automattic/jetpack-components';
import DiffViewer from '../diff-viewer';
import MarkedLines from '../marked-lines';
import styles from './styles.module.scss';

/**
 * ThreatTechnicalDetails component
 *
 * @param {object} props        - The props.
 * @param {Threat} props.threat - The threat.
 *
 * @return {JSX.Element | null} The rendered technical details or null if no details are available.
 */
const ThreatTechnicalDetails = ( { threat }: { threat: Threat } ): JSX.Element => {
	const [ open, setOpen ] = useState( false );

	let toggleContent = __( 'Show the technical details', 'jetpack-components' );
	if ( open ) {
		toggleContent = __( 'Hide the technical details', 'jetpack-components' );
	}

	const toggleOpen = useCallback( () => {
		setOpen( ! open );
	}, [ open ] );

	if ( ! threat.filename && ! threat.context && ! threat.diff ) {
		return null;
	}

	return (
		<div className={ styles.section }>
			<div className={ styles.section__title }>
				<Button
					variant="link"
					className={ styles.section__toggle }
					aria-expanded={ open }
					aria-controls={ `threat-details-${ threat.id }` }
					onClick={ toggleOpen }
				>
					<div className={ styles.section__toggle__content }>
						<Text variant="title-small" mb={ 0 }>
							{ toggleContent }
						</Text>
						<Icon icon={ open ? chevronUp : chevronDown } size={ 24 } />
					</div>
				</Button>
			</div>
			{ open && (
				<div
					className={ open ? styles.section__open : styles.section__closed }
					id={ `threat-details-${ threat.id }` }
				>
					{ threat.filename && (
						<>
							<Text>{ __( 'Threat found in file:', 'jetpack-components' ) }</Text>
							<pre className={ styles.filename }>{ threat.filename }</pre>
						</>
					) }
					{ threat.context && <MarkedLines context={ threat.context } /> }
					{ threat.diff && <DiffViewer diff={ threat.diff } /> }
				</div>
			) }
		</div>
	);
};

export default ThreatTechnicalDetails;
