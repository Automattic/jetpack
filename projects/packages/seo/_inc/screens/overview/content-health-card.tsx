import { Button } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import { NavLink } from 'react-router';
import { JetpackSeoRoutes } from '../../constants';
import styles from './style.module.scss';
import type { OverviewResponse } from '../../data/overview-types';
import type { FC } from 'react';

interface Props {
	data: OverviewResponse[ 'content_seo' ];
}

const ContentHealthCard: FC< Props > = ( { data } ) => {
	const sampleNote = sprintf(
		/* translators: %d: number of posts analyzed for this dashboard snapshot */
		_n(
			'Based on a sample of %d recent post.',
			'Based on a sample of %d recent posts.',
			data.sample_size,
			'jetpack-seo'
		),
		data.sample_size
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Content SEO health', 'jetpack-seo' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<div className={ styles.statRow }>
					<span>{ __( 'Published posts', 'jetpack-seo' ) }</span>
					<span className={ styles.statValue }>{ data.total_published }</span>
				</div>
				<div className={ styles.statRow }>
					<span>{ __( 'Missing SEO title', 'jetpack-seo' ) }</span>
					<span className={ styles.statValue }>{ data.missing_title }</span>
				</div>
				<div className={ styles.statRow }>
					<span>{ __( 'Missing description', 'jetpack-seo' ) }</span>
					<span className={ styles.statValue }>{ data.missing_desc }</span>
				</div>
				<div className={ styles.statRow }>
					<span>{ __( 'Marked noindex', 'jetpack-seo' ) }</span>
					<span className={ styles.statValue }>{ data.noindexed }</span>
				</div>
				<p className={ styles.loading }>{ sampleNote }</p>
				<div className={ styles.cardFooter }>
					<Button variant="primary" as={ NavLink } to={ JetpackSeoRoutes.Content }>
						{ __( 'Review content', 'jetpack-seo' ) }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
};

export default ContentHealthCard;
