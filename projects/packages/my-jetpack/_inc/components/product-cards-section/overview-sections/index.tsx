import { __ } from '@wordpress/i18n';
import { dashboard, shield, trendingUp } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { PRODUCT_SLUGS } from '../../../data/constants';
import LoadingBlock from '../../loading-block';
import BoostOverviewItem from '../boost-card/overview';
import OverviewSection from '../overview-section';
import ProtectOverviewItem from '../protect-card/overview';
import StatsOverviewItem from '../stats-card/overview';
import styles from './style.module.scss';
import type { FC } from 'react';

type OverviewSectionsProps = {
	slugs: JetpackModule[];
	admin: boolean;
	showStats: boolean;
	isLoading?: boolean;
};

/**
 * The Overview heading and its sections.
 *
 * @param {OverviewSectionsProps} props - Component props.
 * @return {import('react').JSX.Element} The sections.
 */
const OverviewSections: FC< OverviewSectionsProps > = ( {
	slugs,
	admin,
	showStats,
	isLoading = false,
} ) => (
	<div className={ styles.sections }>
		<Text variant="heading-xl" render={ <h2 /> } className={ styles.welcome }>
			{ __( 'Welcome to Jetpack', 'jetpack-my-jetpack' ) }
		</Text>
		{ isLoading && (
			<>
				<LoadingBlock width="100%" height="350px" />
				<LoadingBlock width="100%" height="150px" />
				<LoadingBlock width="100%" height="150px" />
			</>
		) }
		{ ! isLoading && showStats && (
			<OverviewSection
				icon={ trendingUp }
				title={ __( 'How is your site growing?', 'jetpack-my-jetpack' ) }
			>
				<StatsOverviewItem admin={ admin } />
			</OverviewSection>
		) }
		{ ! isLoading && slugs.includes( PRODUCT_SLUGS.PROTECT ) && (
			<OverviewSection
				icon={ shield }
				title={ __( 'How well is my site protected?', 'jetpack-my-jetpack' ) }
			>
				<ProtectOverviewItem admin={ admin } />
			</OverviewSection>
		) }
		{ ! isLoading && slugs.includes( PRODUCT_SLUGS.BOOST ) && (
			<OverviewSection
				icon={ dashboard }
				title={ __( 'What is my site status?', 'jetpack-my-jetpack' ) }
			>
				<BoostOverviewItem admin={ admin } />
			</OverviewSection>
		) }
	</div>
);

export default OverviewSections;
