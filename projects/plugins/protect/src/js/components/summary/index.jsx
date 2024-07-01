import {
	Container,
	Col,
	Text,
	Title,
	getIconBySlug,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import React, { useState } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import OnboardingPopover from '../onboarding-popover';
import ScanSectionNav from '../scan-section-nav';
import styles from './styles.module.scss';

const Summary = () => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const { numThreats, lastChecked, hasRequiredPlan } = useProtectData();
	const Icon = getIconBySlug( 'protect' );

	// Popover anchors
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );

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
					<div className={ styles.summary__actions }>{ hasRequiredPlan && <ScanSectionNav /> }</div>
				</div>
			</Col>
		</Container>
	);
};

export default Summary;
