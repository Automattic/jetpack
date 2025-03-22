import { Text, Button, DiffViewer, MarkedLines } from '@automattic/jetpack-components';
import { Panel, PanelBody, PanelRow } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp, Icon } from '@wordpress/icons';
import { useState, useCallback } from 'react';
import { getSeverityLabel, Threat } from '@automattic/jetpack-scan';
import styles from '../styles.module.scss';

/**
 * ThreatTechnicalDetails component
 *
 * @param {object} props        - The component props.
 * @param {Threat} props.threat - The threat to display.
 * @return {JSX.Element | null} The rendered technical details or null if no details are available.
 */
const ThreatDetailsModalTechnicalDetails = ( { threat }: { threat: Threat } ): JSX.Element => {
	const [ open, setOpen ] = useState( false );

	let toggleContent = __( 'Show the technical details', 'jetpack-scan' );
	if ( open ) {
		toggleContent = __( 'Hide the technical details', 'jetpack-scan' );
	}

	const toggleOpen = useCallback( () => {
		setOpen( ! open );
	}, [ open ] );

	const hasTechnicalDetails =
		threat.firstDetected ||
		threat.signature ||
		threat.filename ||
		threat.context ||
		threat.diff ||
		threat.severity ||
		threat.vulnerabilities?.length;

	if ( ! hasTechnicalDetails && ! threat.source ) {
		return null;
	}

	if ( ! hasTechnicalDetails && threat.source ) {
		return (
			<div>
				<Button variant="link" isExternalLink={ true } weight="regular" href={ threat.source }>
					{ __( 'See more technical details of this threat', 'jetpack-scan' ) }
				</Button>
			</div>
		);
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
						threat.severity ||
						threat.source ) && (
						<div>
							<div className={ styles.properties }>
								{ !! threat.firstDetected && (
									<>
										<Text>{ __( 'First Detected', 'jetpack-scan' ) }</Text>
										<Text>{ dateI18n( 'F j, Y H:i a', threat.firstDetected ) }</Text>
									</>
								) }
								{ !! threat.fixedOn && (
									<>
										<Text>{ __( 'Fixed On', 'jetpack-scan' ) }</Text>
										<Text>{ dateI18n( 'F j, Y H:i a', threat.fixedOn ) }</Text>
									</>
								) }
								{ !! threat.signature && (
									<>
										<Text>{ __( 'Signature', 'jetpack-scan' ) }</Text>
										<Text>{ threat.signature }</Text>
									</>
								) }
								{ !! threat.severity && (
									<>
										<Text>{ __( 'Severity', 'jetpack-scan' ) }</Text>
										<Text>
											{ sprintf(
												'%1$s (%2$s)',
												threat.severity,
												getSeverityLabel( threat.severity )
											) }
										</Text>
									</>
								) }
								{ !! threat.filename && (
									<>
										<Text>{ __( 'File', 'jetpack-scan' ) }</Text>
										<div>
											<pre className={ styles.filename }>{ threat.filename }</pre>
										</div>
									</>
								) }
								{ !! threat.context && (
									<>
										<Text>{ __( 'Context', 'jetpack-scan' ) }</Text>
										<div>
											<MarkedLines context={ threat.context } />
										</div>
									</>
								) }
								{ !! threat.diff && (
									<>
										<Text>{ __( 'Diff', 'jetpack-scan' ) }</Text>
										<div>
											<DiffViewer diff={ threat.diff } />
										</div>
									</>
								) }
								{ !! threat.source && (
									<>
										<Text>{ __( 'Source', 'jetpack-scan' ) }</Text>
										<div>
											<Button
												variant="link"
												isExternalLink={ true }
												weight="regular"
												href={ threat.source }
											>
												{ __( 'See more technical details of this threat', 'jetpack-scan' ) }
											</Button>
										</div>
									</>
								) }
							</div>
						</div>
					) }

					{ !! threat.vulnerabilities?.length && (
						<div className={ styles.vulnerabilities }>
							<Panel>
								{ threat.vulnerabilities.map( ( vulnerability, index ) => (
									<PanelBody title={ vulnerability.title } key={ index } initialOpen={ false }>
										<PanelRow>
											<div>
												<Text mb={ vulnerability.source ? 2 : 0 }>
													{ vulnerability.description }
												</Text>
												{ vulnerability.source && (
													<Button
														variant="link"
														isExternalLink={ true }
														weight="regular"
														href={ vulnerability.source }
													>
														{ __( 'Source', 'jetpack-scan' ) }
													</Button>
												) }
											</div>
										</PanelRow>
									</PanelBody>
								) ) }
							</Panel>
						</div>
					) }
				</>
			) }
		</div>
	);
};

export default ThreatDetailsModalTechnicalDetails;
