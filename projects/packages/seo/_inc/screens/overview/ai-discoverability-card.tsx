import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import { NavLink } from 'react-router';
import { JetpackSeoRoutes } from '../../constants';
import StatusDot from './status-dot';
import styles from './style.module.scss';
import type { OverviewResponse } from '../../data/overview-types';
import type { FC } from 'react';

interface Props {
	data: OverviewResponse[ 'ai_discoverability' ];
}

const AiDiscoverabilityCard: FC< Props > = ( { data } ) => {
	const crawlers = Object.entries( data.crawlers );
	const blocked = crawlers.filter( ( [ , v ] ) => v === 'block' ).length;
	const total = crawlers.length;
	const crawlerSummary = sprintf(
		/* translators: 1: blocked count, 2: total count */
		__( '%1$d of %2$d AI crawlers blocked', 'jetpack-seo' ),
		blocked,
		total
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'AI discoverability', 'jetpack-seo' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<div className={ styles.statRow }>
					<StatusDot
						status={ data.llms_txt_enabled ? 'ok' : 'warn' }
						label={
							data.llms_txt_enabled
								? __( 'llms.txt enabled', 'jetpack-seo' )
								: __( 'llms.txt disabled', 'jetpack-seo' )
						}
					/>
				</div>
				<div className={ styles.statRow }>
					<span>{ crawlerSummary }</span>
				</div>
				<div className={ styles.cardFooter }>
					<Button variant="primary" as={ NavLink } to={ JetpackSeoRoutes.Settings }>
						{ __( 'Manage discoverability', 'jetpack-seo' ) }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
};

export default AiDiscoverabilityCard;
