import { Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';

type SpeculationRulesNoticeProps = {
	showNotice: boolean;
};

const SpeculationRulesNotice = ( { showNotice }: SpeculationRulesNoticeProps ) => {
	const [ isDismissed, setIsDismissed ] = useState( false );

	// Only show the notice if it should be shown and hasn't been dismissed
	if ( ! showNotice || isDismissed ) {
		return null;
	}

	return (
		<Notice
			level="warning"
			title={ __( 'Cornerstone Pages will be prerendered', 'jetpack-boost' ) }
			onClose={ () => setIsDismissed( true ) }
		>
			<p>
				{ __(
					'Prerender mode may cause inflated statistics and increased server load as it fully loads pages in the background. Monitor your site performance and server resources carefully.',
					'jetpack-boost'
				) }
			</p>
		</Notice>
	);
};

export default SpeculationRulesNotice;
