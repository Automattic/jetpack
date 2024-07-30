import { useBreakpointMatch } from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import React, { useState } from 'react';
import useProtectData from '../../hooks/use-protect-data';
import ScanSectionHeader from '../../routes/scan/scan-section-header';
import OnboardingPopover from '../onboarding-popover';

const Summary = () => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const { numThreats, lastChecked, hasRequiredPlan } = useProtectData();

	// Popover anchors
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );

	return (
		<ScanSectionHeader
			title={
				numThreats > 0
					? sprintf(
							/* translators: %s: Total number of threats  */
							__( '%1$s %2$s found', 'jetpack-protect' ),
							numThreats,
							numThreats === 1 ? 'threat' : 'threats'
					  )
					: undefined
			}
			subtitle={
				<>
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
				</>
			}
		/>
	);
};

export default Summary;
