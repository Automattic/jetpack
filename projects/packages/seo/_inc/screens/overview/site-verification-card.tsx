import { __ } from '@wordpress/i18n';
import { Button, Card, Stack } from '@wordpress/ui';
import { VERIFICATION_SERVICES } from '../../data/verification-services';
import StatusDot from './status-dot';
import styles from './style.module.scss';
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
		<Stack render={ <Card.Content /> } direction="column" className={ styles.cardContent }>
			{ VERIFICATION_SERVICES.map( ( { key, label } ) => (
				<Stack
					key={ key }
					direction="row"
					align="center"
					justify="space-between"
					className={ styles.statRow }
				>
					<StatusDot status={ data[ key ] ? 'ok' : 'warn' } label={ label } />
					<span>{ data[ key ] ? setLabel : notSetLabel }</span>
				</Stack>
			) ) }
			<Stack direction="row" justify="flex-end" className={ styles.footer }>
				<Button variant="outline" tone="neutral" onClick={ onManage }>
					{ __( 'Manage verification', 'jetpack-seo' ) }
				</Button>
			</Stack>
		</Stack>
	</Card.Root>
);

export default SiteVerificationCard;
