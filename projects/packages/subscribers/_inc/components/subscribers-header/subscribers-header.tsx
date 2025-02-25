import { Gridicon } from '@automattic/components';
import { useLocalizeUrl } from '@automattic/i18n-utils';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { Button, ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
//import NavigationHeader from 'calypso/components/navigation-header';
//import { useSubscribersPage } from 'calypso/my-sites/subscribers/components/subscribers-page/subscribers-page-context';
import { ReactElement } from 'react';
//import { SubscribersHeaderPopover } from '../subscribers-header-popover';

type SubscribersHeaderProps = {
	selectedSiteId: number | undefined;
	disableCta: boolean;
	hideSubtitle?: boolean;
};

export const SubscribersHeader = ( {
	disableCta,
	hideSubtitle,
}: SubscribersHeaderProps ): ReactElement => {
	//const { setShowAddSubscribersModal } = useSubscribersPage();
	const localizeUrl = useLocalizeUrl();
	const isWPCOMSite = isWpcomPlatformSite();

	const paidNewsletterUrl = ! isWPCOMSite
		? 'https://jetpack.com/support/newsletter/paid-newsletters/'
		: 'https://wordpress.com/support/paid-newsletters/';

	const message = __(
		'Add subscribers to your site and send them a free or <link>paid newsletter</link>.',
		'jetpack-subscribers'
	);
	const subtitleOptions = createInterpolateElement( message, {
		link: <ExternalLink href={ localizeUrl( paidNewsletterUrl ) } />,
	} );

	return (
		<div
			className="stats__section-header modernized-header"
			title={ __( 'Subscribers', 'jetpack-subscribers' ) }
		>
			{ hideSubtitle ? null : subtitleOptions }
			<Button
				className="add-subscribers-button"
				primary
				disabled={ disableCta }
				//onClick={ () => setShowAddSubscribersModal( true ) }
			>
				<Gridicon icon="plus" size={ 24 } />
				<span className="add-subscribers-button-text">
					{ __( 'Add subscribers', 'jetpack-subscribers' ) }
				</span>
			</Button>
			{
				// <SubscribersHeaderPopover />
			 }
		</div>
	);
};
