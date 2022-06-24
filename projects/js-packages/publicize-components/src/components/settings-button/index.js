/**
 * Publicize settings button component.
 *
 * Component which allows user to click to open settings
 * in a new window/tab.
 * If window/tab is closed,
 * then connections will be automatically refreshed.
 */
import { getSiteFragment, getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { debounce } from 'lodash';
import PageVisibility from 'react-page-visibility';
import useSelectSocialMediaConnections from '../../hooks/use-social-media-connections';
import styles from './styles.module.scss';

const refreshThreshold = 2000;

/**
 * The link to manage connections displayed beneath the connections list.
 *
 * @returns {object} The link/button component.
 */
export default function PublicizeSettingsButton() {
	const { refresh } = useSelectSocialMediaConnections();
	const siteFragment = getSiteFragment();

	const debouncedRefresh = debounce( function ( isVisible ) {
		if ( ! isVisible ) {
			return;
		}
		refresh();
	}, refreshThreshold );

	const connectionsUrl =
		getJetpackData()?.publicizeConnectionsUrl ?? 'https://wordpress.com/marketing/connections/';
	/*
	 * We should always have a siteFragment. If not, then something has
	 * probably gone wrong.
	 *
	 * TODO: Work out if it's safe to stop sending people to the local
	 * settings page.
	 */
	const href = siteFragment
		? `${ connectionsUrl }${ siteFragment }`
		: 'options-general.php?page=sharing&publicize_popup=true';

	return (
		<PageVisibility onChange={ debouncedRefresh }>
			<div className={ styles[ 'add-connection-wrapper' ] }>
				<ExternalLink href={ href } target="_blank">
					{ __( 'Connect an account', 'jetpack' ) }
				</ExternalLink>
			</div>
		</PageVisibility>
	);
}
