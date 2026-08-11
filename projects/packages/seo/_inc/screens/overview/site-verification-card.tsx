import { __ } from '@wordpress/i18n';
import { globe } from '@wordpress/icons';
import { Button, Card, Stack } from '@wordpress/ui';
import { PRIMARY_VERIFICATION_KEYS, VERIFICATION_SERVICES } from '../../data/verification-services';
import CardHeaderIcon from './card-header-icon';
import StatusDot from './status-dot';
import styles from './style.module.scss';
import type { SiteVerification } from '../../data/overview-types';
import type { FC } from 'react';

interface Props {
	data: SiteVerification;
	active: boolean;
	onManage: () => void;
}

// Module-scope so the production minifier can't fold an adjacent ternary
// `__()` into `__(cond ? A : B)`. See feedback_i18n_ternary_minifier_fold.
const setLabel = __( 'Set', 'jetpack-seo' );
const notSetLabel = __( 'Not set', 'jetpack-seo' );
const disabledLabel = __( 'Disabled', 'jetpack-seo' );

const getStatusLabel = ( active: boolean, set: boolean ) => {
	if ( ! active ) {
		return disabledLabel;
	}
	return set ? setLabel : notSetLabel;
};

const SiteVerificationCard: FC< Props > = ( { data, active, onManage } ) => {
	// The globally-relevant services always get a row; the rest only when this site
	// has actually verified with them. Listing all five padded the summary with
	// services most sites will never use, but hiding a verified one outright would
	// show a verified site as unverified — any single service completes the
	// setting, so a Yandex-only site would otherwise read as three "Not set" rows
	// while Settings reports it Complete. Order follows VERIFICATION_SERVICES.
	const services = VERIFICATION_SERVICES.filter(
		( { key } ) => PRIMARY_VERIFICATION_KEYS.includes( key ) || Boolean( data[ key ] )
	);

	return (
		<Card.Root>
			{ /* `globe` rather than `check`: a checkmark reads as "done/complete", which is
			     the state of an individual row here, not what the card is about. */ }
			<CardHeaderIcon icon={ globe } title={ __( 'Site verification', 'jetpack-seo' ) } />
			<Stack render={ <Card.Content /> } direction="column" className={ styles.cardContent }>
				{ services.map( ( { key, label } ) => (
					<Stack
						key={ key }
						direction="row"
						align="center"
						justify="space-between"
						className={ styles.statRow }
					>
						<StatusDot status={ active && data[ key ] ? 'ok' : 'warn' } label={ label } />
						<span>{ getStatusLabel( active, data[ key ] ) }</span>
					</Stack>
				) ) }
				<Stack direction="row" justify="flex-end" className={ styles.footer }>
					<Button variant="solid" size="compact" onClick={ onManage }>
						{ __( 'Manage verification', 'jetpack-seo' ) }
					</Button>
				</Stack>
			</Stack>
		</Card.Root>
	);
};

export default SiteVerificationCard;
