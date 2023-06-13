import { imagePath } from 'constants/urls';
import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import analytics from 'lib/analytics';
import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { getSiteRawUrl } from 'state/initial-state';
import { SidebarCard } from '../sidebar-card';

const SecurityComponent = props => {
	const { siteRawUrl } = props;

	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_display', {
			type: 'security',
		} );
	}, [] );

	const onCtaClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_summary_sidebar_click', {
			type: 'security',
		} );
	}, [] );

	return (
		<SidebarCard illustrationPath={ imagePath + '/recommendations/manage-security.svg' }>
			<div>
				<h2>{ __( 'Manage your security on Jetpack.com', 'jetpack' ) }</h2>
				<p>
					{ __(
						'Did you know you can manage all your backups right from Jetpack.com?',
						'jetpack'
					) }
				</p>
				<p>
					{ __(
						'You can also use your included Activity feature to monitor every change that occurs on your site!',
						'jetpack'
					) }
				</p>
				<Button
					rna
					href={ getRedirectUrl( 'jetpack-backup', { site: siteRawUrl } ) }
					target="_blank"
					rel="noopener noreferrer"
					onClick={ onCtaClick }
				>
					{ __( 'Manage security on Jetpack.com', 'jetpack' ) }
					<Gridicon icon="external" />
				</Button>
			</div>
		</SidebarCard>
	);
};

const Security = connect( state => ( { siteRawUrl: getSiteRawUrl( state ) } ) )(
	SecurityComponent
);

export { Security };
