import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import { NavLink } from 'react-router';
import { JetpackSeoRoutes } from '../../constants';
import StatusDot from './status-dot';
import styles from './style.module.scss';
import type { OverviewResponse } from '../../data/overview-types';
import type { FC } from 'react';

interface Props {
	data: OverviewResponse[ 'site_verification' ];
}

const services: Array< { key: keyof OverviewResponse[ 'site_verification' ]; label: string } > = [
	{ key: 'google', label: 'Google' },
	{ key: 'bing', label: 'Bing' },
	{ key: 'pinterest', label: 'Pinterest' },
	{ key: 'yandex', label: 'Yandex' },
	{ key: 'facebook', label: 'Facebook' },
];

const SiteVerificationCard: FC< Props > = ( { data } ) => (
	<Card.Root>
		<Card.Header>
			<Card.Title>{ __( 'Site verification', 'jetpack-seo' ) }</Card.Title>
		</Card.Header>
		<Card.Content>
			{ services.map( ( { key, label } ) => {
				const isSet = !! data[ key ];
				return (
					<div key={ key } className={ styles.statRow }>
						<StatusDot status={ isSet ? 'ok' : 'warn' } label={ label } />
						<span>
							{ isSet ? __( 'Verified', 'jetpack-seo' ) : __( 'Not set', 'jetpack-seo' ) }
						</span>
					</div>
				);
			} ) }
			<div className={ styles.cardFooter }>
				<Button variant="secondary" as={ NavLink } to={ JetpackSeoRoutes.Settings }>
					{ __( 'Edit verification', 'jetpack-seo' ) }
				</Button>
			</div>
		</Card.Content>
	</Card.Root>
);

export default SiteVerificationCard;
