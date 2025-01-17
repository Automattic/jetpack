import { getSeverityLabel, ThreatsContext } from '@automattic/jetpack-scan';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp, Icon } from '@wordpress/icons';
import { useState, useCallback, useContext } from 'react';
import { Text, Button } from '@automattic/jetpack-components';
import DiffViewer from '../../diff-viewer';
import MarkedLines from '../../marked-lines';
import styles from '../styles.module.scss';

/**
 * ThreatTechnicalDetails component
 *
 * @return {JSX.Element | null} The rendered technical details or null if no details are available.
 */
const ThreatDetailsModalTechnicalDetails = (): JSX.Element => {
	const { selectedThreat: threat } = useContext( ThreatsContext );

	const [ open, setOpen ] = useState( false );

	let toggleContent = __( 'Show the technical details', 'jetpack-components' );
	if ( open ) {
		toggleContent = __( 'Hide the technical details', 'jetpack-components' );
	}

	const toggleOpen = useCallback( () => {
		setOpen( ! open );
	}, [ open ] );

	if (
		! (
			threat.firstDetected ||
			threat.signature ||
			threat.filename ||
			threat.context ||
			threat.diff ||
			threat.severity ||
			threat.vulnerabilities?.length
		)
	) {
		return null;
	}

	return (
		<div className={ styles[ 'threat-modal__section' ] }>
			<div>
				<Button
					variant="link"
					weight="regular"
					className={ styles[ 'threat-modal__toggle' ] }
					aria-expanded={ open }
					aria-controls={ `threat-details-${ threat.id }` }
					onClick={ toggleOpen }
				>
					<div className={ styles[ 'threat-modal__section__toggle__content' ] }>
						{ toggleContent }
						<Icon icon={ open ? chevronUp : chevronDown } size={ 24 } />
					</div>
				</Button>
			</div>
			{ open && (
				<>
					{ ( threat.firstDetected ||
						threat.signature ||
						threat.filename ||
						threat.context ||
						threat.diff ||
						threat.severity ) && (
						<div>
							<div className={ styles.properties }>
								{ !! threat.firstDetected && (
									<>
										<Text>{ __( 'First Detected', 'jetpack-components' ) }</Text>
										<Text>{ dateI18n( 'F j, Y H:i a', threat.firstDetected ) }</Text>
									</>
								) }
								{ !! threat.fixedOn && (
									<>
										<Text>{ __( 'Fixed On', 'jetpack-components' ) }</Text>
										<Text>{ dateI18n( 'F j, Y H:i a', threat.fixedOn ) }</Text>
									</>
								) }
								{ !! threat.signature && (
									<>
										<Text>{ __( 'Signature', 'jetpack-components' ) }</Text>
										<Text>{ threat.signature }</Text>
									</>
								) }
								{ !! threat.severity && (
									<>
										<Text>{ __( 'Severity', 'jetpack-components' ) }</Text>
										<Text>
											{ sprintf(
												'%1$s (%2$s)',
												threat.severity,
												getSeverityLabel( threat.severity )
											) }
										</Text>
									</>
								) }
								{ threat.filename && (
									<>
										<Text>{ __( 'File', 'jetpack-components' ) }</Text>
										<div>
											<pre className={ styles.filename }>{ threat.filename }</pre>
										</div>
									</>
								) }
								{ threat.context && (
									<>
										<Text>{ __( 'Context', 'jetpack-components' ) }</Text>
										<div>
											<MarkedLines context={ threat.context } />
										</div>
									</>
								) }
								{ threat.diff && (
									<>
										<Text>{ __( 'Diff', 'jetpack-components' ) }</Text>
										<div>
											<DiffViewer diff={ threat.diff } />
										</div>
									</>
								) }
							</div>
						</div>
					) }

					{ !! threat.vulnerabilities?.length && (
						<>
							<div>
								<Panel>
									{ threat.vulnerabilities.map( ( vulnerability, index ) => (
										<PanelBody title={ vulnerability.title } key={ index } initialOpen={ false }>
											<PanelRow>
												<div>
													<Text variant="body-small" mb={ vulnerability.source ? 2 : 0 }>
														{ vulnerability.description }
													</Text>
													{ vulnerability.source && (
														<Button
															variant="link"
															isExternalLink={ true }
															weight="regular"
															size="small"
															href={ vulnerability.source }
														>
															{ __(
																'See more technical details of this vulnerability',
																'jetpack-components'
															) }
														</Button>
													) }
												</div>
											</PanelRow>
										</PanelBody>
									) ) }
								</Panel>
							</div>
						</>
					) }
				</>
			) }
		</div>
	);
};

export default ThreatDetailsModalTechnicalDetails;
