import { PreLaunchModal } from '@automattic/site-launch-modals/pre-launch-modal';
import { addQueryArgs } from '@wordpress/url';
import { useState } from 'react';
import { wpcomTrackEvent } from '../../../common/tracks';

import './pre-launch-site-modal.scss';

// The preview iframe renders the site at desktop width and is scaled down into
// the thumbnail box, matching the Calypso pre-launch preview.
const PREVIEW_BASE_WIDTH = 1200;
const THUMBNAIL_WIDTH = 114;
const THUMBNAIL_HEIGHT = 88;

interface Props {
	siteName: string;
	siteDomain: string;
	homeUrl: string;
	planName: string;
	launchUrl: string;
	onClose: () => void;
}

/**
 * The Reading-settings wrapper around the shared pre-launch modal. Every value
 * the modal needs is already localized on the page, so — unlike Calypso — this
 * wrapper fetches nothing. On confirm it hands off to the same
 * `/start/launch-site` URL the button used before.
 *
 * @param  props            - Component props.
 * @param  props.siteName   - The site title shown in the modal.
 * @param  props.siteDomain - The site's primary (custom) domain.
 * @param  props.homeUrl    - The site's front-end URL, used for the preview.
 * @param  props.planName   - The paid plan's display name.
 * @param  props.launchUrl  - Where confirming launch redirects to.
 * @param  props.onClose    - Called when the modal is dismissed.
 * @return {import('react').JSX.Element} The pre-launch modal.
 */
export default function PreLaunchSiteModal( {
	siteName,
	siteDomain,
	homeUrl,
	planName,
	launchUrl,
	onClose,
}: Props ) {
	const [ isLaunching, setIsLaunching ] = useState( false );

	const scale = THUMBNAIL_WIDTH / PREVIEW_BASE_WIDTH;

	return (
		<PreLaunchModal
			siteName={ siteName }
			siteDomain={ siteDomain }
			planName={ planName }
			isLaunching={ isLaunching }
			onClose={ onClose }
			onLaunch={ () => {
				setIsLaunching( true );
				wpcomTrackEvent( 'wpcom_launch_site_pre_launch_modal_confirm' );
				window.location.href = launchUrl;
			} }
			preview={
				<div className="wpcom-pre-launch-site-modal__thumbnail">
					<iframe
						title={ siteName }
						src={ addQueryArgs( homeUrl, {
							hide_banners: true,
							preview: true,
							iframe: true,
						} ) }
						sandbox="allow-scripts allow-same-origin"
						scrolling="no"
						loading="lazy"
						tabIndex={ -1 }
						width={ PREVIEW_BASE_WIDTH }
						height={ THUMBNAIL_HEIGHT / scale }
						style={ {
							border: 'none',
							transform: `scale(${ scale })`,
							transformOrigin: 'top left',
						} }
					/>
				</div>
			}
		/>
	);
}
