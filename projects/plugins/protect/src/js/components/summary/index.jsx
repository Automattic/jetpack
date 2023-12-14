import {
	Container,
	Col,
	Text,
	Title,
	getIconBySlug,
	Button,
	ActionPopover,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { useDispatch, useSelect } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import React, { useRef, useEffect } from 'react';
import { JETPACK_SCAN_SLUG } from '../../constants';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import { STORE_ID } from '../../state/store';
import styles from './styles.module.scss';

const Summary = ( {
	anchors,
	setAnchors,
	onboardingStep,
	incrementOnboardingStep,
	closeOnboarding,
} ) => {
	const { numThreats, lastChecked, hasRequiredPlan } = useProtectData();
	const scanIsEnqueuing = useSelect( select => select( STORE_ID ).getScanIsEnqueuing() );
	const { scan } = useDispatch( STORE_ID );
	const Icon = getIconBySlug( 'protect' );

	const { adminUrl } = window.jetpackProtectInitialState || {};
	const { run } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN_SLUG,
		redirectUrl: adminUrl,
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_threat_list_get_scan_link_click', run );

	const handleScanClick = () => {
		return event => {
			event.preventDefault();
			scan();
		};
	};

	const anchor2aRef = useRef( null );
	const anchor2bRef = useRef( null );

	useEffect( () => {
		setAnchors( prevAnchors => ( {
			...prevAnchors, // Spread the existing anchors
			anchor2a: anchor2aRef.current,
			anchor2b: anchor2bRef.current,
		} ) );
	}, [ anchor2aRef, anchor2bRef, setAnchors ] );

	return (
		<Container fluid>
			<Col>
				<div className={ styles.summary }>
					<div>
						{ ! hasRequiredPlan && onboardingStep === 2 && (
							<ActionPopover
								title={ __( 'Daily automated scans', 'jetpack-protect' ) }
								buttonContent={ __( 'Finish', 'jetpack-protect' ) }
								anchor={ anchors.anchor2a }
								onClose={ closeOnboarding }
								onClick={ incrementOnboardingStep }
								noArrow={ false }
								className={ styles[ 'action-popover' ] }
								position={ 'middle right' }
								offset={ 15 }
								step={ 2 }
								totalSteps={ 2 }
							>
								<Text>
									{ createInterpolateElement(
										__(
											'We run daily automated scans. Do you want ot be able to scan manually? <upgradeLink>Upgrade</upgradeLink>',
											'jetpack-protect'
										),
										{
											upgradeLink: <Button variant="link" weight="regular" onClick={ getScan } />,
										}
									) }
								</Text>
							</ActionPopover>
						) }
						<Title size="small" className={ styles.summary__title }>
							<Icon size={ 32 } className={ styles.summary__icon } />
							<span ref={ ! hasRequiredPlan ? anchor2aRef : null }>
								{ sprintf(
									/* translators: %s: Latest check date  */
									__( 'Latest results as of %s', 'jetpack-protect' ),
									dateI18n( 'F jS', lastChecked )
								) }
							</span>
						</Title>
						{ numThreats > 0 && (
							<Text variant="headline-small" component="h1">
								{ sprintf(
									/* translators: %s: Total number of threats  */
									__( '%1$s %2$s found', 'jetpack-protect' ),
									numThreats,
									numThreats === 1 ? 'threat' : 'threats'
								) }
							</Text>
						) }
					</div>
					{ hasRequiredPlan && numThreats === 0 && (
						<>
							{ onboardingStep === 2 && (
								<ActionPopover
									title={ __( 'Daily & manual scanning', 'jetpack-protect' ) }
									buttonContent={ __( 'Finish', 'jetpack-protect' ) }
									anchor={ anchors.anchor2b }
									onClose={ closeOnboarding }
									onClick={ closeOnboarding }
									noArrow={ false }
									className={ styles[ 'action-popover' ] }
									position={ 'middle left' }
									offset={ 15 }
									step={ 2 }
									totalSteps={ 2 }
								>
									<Text>
										{ __(
											'We run daily automated scans but you can also run on-demand scans if you want to check the latest status.',
											'jetpack-protect'
										) }
									</Text>
								</ActionPopover>
							) }
							<Button
								ref={ anchor2bRef }
								variant="secondary"
								className={ styles[ 'summary__scan-button' ] }
								isLoading={ scanIsEnqueuing }
								onClick={ handleScanClick() }
							>
								{ __( 'Scan now', 'jetpack-protect' ) }
							</Button>
						</>
					) }
				</div>
			</Col>
		</Container>
	);
};

export default Summary;
