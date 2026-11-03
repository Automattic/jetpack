import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import { getUpsellUrl } from '../data/is-gated';
import { markUpgradePending } from '../data/upgrade';
import type { FC } from 'react';

const PlanLockedNote: FC< { id?: string } > = ( { id } ) => {
	return (
		<Text variant="body-sm" render={ <p id={ id } /> }>
			{ __( 'Editing is disabled on your current plan.', 'jetpack-seo' ) }{ ' ' }
			<Link
				href={ getUpsellUrl() }
				target="_blank"
				rel="noopener noreferrer"
				onClick={ markUpgradePending }
			>
				{ __( 'Upgrade', 'jetpack-seo' ) }
			</Link>
		</Text>
	);
};

export default PlanLockedNote;
