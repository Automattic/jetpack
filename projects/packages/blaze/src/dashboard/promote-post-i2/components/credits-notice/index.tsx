import { Notice } from '@wordpress/ui';
import { useMemo } from 'react';
import useCreditBalanceQuery from '../../../data/promote-post/use-promote-post-credit-balance-query';
import { useCreditExpirationLines } from '../../hooks/use-credit-expiration-lines';
import { getCreditExpirationInfo } from '../../utils';

import './style.scss';

/**
 *
 */
function CreditsNotice() {
	const { data: { history: creditsHistory = [] } = {} } = useCreditBalanceQuery();
	const { hasExpiringCredits, sortedHistory } = useMemo(
		() => getCreditExpirationInfo( creditsHistory ),
		[ creditsHistory ]
	);

	const expirationLines = useCreditExpirationLines( sortedHistory, false );

	if ( ! hasExpiringCredits || ! expirationLines ) {
		return null;
	}

	return (
		<Notice.Root intent="warning" className="promote-post-i2__credits-notice-content">
			<Notice.Title>{ expirationLines[ 0 ] }</Notice.Title>
			<Notice.Description render={ <div /> }>
				<ul>
					{ expirationLines.slice( 1 ).map( ( line, index ) => (
						<li key={ index }>{ line }</li>
					) ) }
				</ul>
			</Notice.Description>
		</Notice.Root>
	);
}

export default CreditsNotice;
