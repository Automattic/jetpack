import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import useProtectData from '../../hooks/use-protect-data';
import ScanSectionHeader from '../scan-header/scan-section-header';

const Summary = () => {
	const {
		counts: {
			current: { threats: numThreats },
		},
		lastChecked,
	} = useProtectData();

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
			subtitle={ sprintf(
				/* translators: %s: Latest check date  */
				__( 'Latest results as of %s', 'jetpack-protect' ),
				dateI18n( 'F jS', lastChecked )
			) }
		/>
	);
};

export default Summary;
