import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import useOverview from '../../data/use-overview';
import SiteVisibilityCard from './site-visibility-card';
import styles from './style.module.scss';
import type { FC } from 'react';

const OverviewScreen: FC = () => {
	const { data, isLoading, isError, error } = useOverview();

	if ( isLoading ) {
		return (
			<div className={ styles.loading }>
				<Spinner />
				<span>{ __( 'Loading site visibility…', 'jetpack-seo' ) }</span>
			</div>
		);
	}

	if ( isError || ! data ) {
		return (
			<Notice.Root intent="error">
				<Notice.Description>
					{ error?.message ?? __( 'Unable to load overview.', 'jetpack-seo' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	return (
		<>
			{ ! data.plan.seo_enabled_for_site && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ __(
							'SEO tools are not enabled on this site. Some cards reflect the underlying WordPress options only.',
							'jetpack-seo'
						) }
					</Notice.Description>
				</Notice.Root>
			) }
			<div className={ styles.grid }>
				<SiteVisibilityCard data={ data.site_visibility } />
			</div>
		</>
	);
};

export default OverviewScreen;
