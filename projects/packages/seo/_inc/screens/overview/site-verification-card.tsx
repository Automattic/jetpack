import { __ } from '@wordpress/i18n';
import { Button, Card } from '@wordpress/ui';
import { VERIFICATION_SERVICES } from '../../data/verification-services';
import StatusDot from './status-dot';
import type { SiteVerification } from '../../data/overview-types';
import type { FC } from 'react';

interface Props {
	data: SiteVerification;
	onManage: () => void;
}

// Module-scope so the production minifier can't fold an adjacent ternary
// `__()` into `__(cond ? A : B)`. See feedback_i18n_ternary_minifier_fold.
const setLabel = __( 'Set', 'jetpack-seo' );
const notSetLabel = __( 'Not set', 'jetpack-seo' );

const SiteVerificationCard: FC< Props > = ( { data, onManage } ) => (
	<Card.Root>
		<Card.Header>
			<Card.Title>{ __( 'Site verification', 'jetpack-seo' ) }</Card.Title>
		</Card.Header>
		<Card.Content>
			{ VERIFICATION_SERVICES.map( ( { key, label } ) => (
				<div key={ key } className="jetpack-seo-overview__stat-row">
					<StatusDot status={ data[ key ] ? 'ok' : 'warn' } label={ label } />
					<span>{ data[ key ] ? setLabel : notSetLabel }</span>
				</div>
			) ) }
			<div className="jetpack-seo-overview__card-footer">
				<Button variant="outline" tone="neutral" onClick={ onManage }>
					{ __( 'Manage verification', 'jetpack-seo' ) }
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
);

export default SiteVerificationCard;
