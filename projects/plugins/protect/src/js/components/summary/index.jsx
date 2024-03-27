import {
	Container,
	Col,
	Text,
	Title,
	getIconBySlug,
	Button,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import React, { useState } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import { STORE_ID } from '../../state/store';
import OnboardingPopover from '../onboarding-popover';
import styles from './styles.module.scss';

const Summary = () => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const { numThreats, lastChecked, hasRequiredPlan } = useProtectData();
	const scanIsEnqueuing = useSelect( select => select( STORE_ID ).getScanIsEnqueuing() );
	const { scan } = useDispatch( STORE_ID );
	const Icon = getIconBySlug( 'protect' );

	// Popover anchors
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );
	const [ dailyAndManualScansPopoverAnchor, setDailyAndManualScansPopoverAnchor ] =
		useState( null );

	const handleScanClick = () => {
		return event => {
			event.preventDefault();
			scan();
		};
	};

	return (
		<Container fluid>
			<Col>
				<div className={ styles.summary }>
					<div>
						<Title size="small" className={ styles.summary__title }>
							<Icon size={ 32 } className={ styles.summary__icon } />
							<div ref={ setDailyScansPopoverAnchor }>
								{ sprintf(
									/* translators: %s: Latest check date  */
									__( 'Latest results as of %s', 'jetpack-protect' ),
									dateI18n( 'F jS', lastChecked )
								) }
							</div>
							{ ! hasRequiredPlan && (
								<OnboardingPopover
									id="free-daily-scans"
									position={ isSm ? 'bottom' : 'middle right' }
									anchor={ dailyScansPopoverAnchor }
								/>
							) }
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
							<Button
								ref={ setDailyAndManualScansPopoverAnchor }
								variant="secondary"
								className={ styles[ 'summary__scan-button' ] }
								isLoading={ scanIsEnqueuing }
								onClick={ handleScanClick() }
							>
								{ __( 'Scan now', 'jetpack-protect' ) }
							</Button>
							<OnboardingPopover
								id="paid-daily-and-manual-scans"
								position="middle left"
								anchor={ dailyAndManualScansPopoverAnchor }
							/>
						</>
					) }
				</div>
			</Col>
		</Container>
	);
};

export default Summary;
