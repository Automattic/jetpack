/**
 * Publicize settings button component.
 *
 * Component which allows user to click to open settings
 * in a new window/tab.
 * If window/tab is closed,
 * then connections will be automatically refreshed.
 */
import { __ } from '@wordpress/i18n';
import { debounce } from 'lodash';
import PageVisibility from 'react-page-visibility';
import usePublicizeConfig from '../../hooks/use-publicize-config';
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

	const debouncedRefresh = debounce( function ( isVisible ) {
		if ( ! isVisible ) {
			return;
		}
		refresh();
	}, refreshThreshold );

	const { connectionsAdminUrl } = usePublicizeConfig();
	/*
	 * We should always have a siteFragment. If not, then something has
	 * probably gone wrong.
	 *
	 * TODO: Work out if it's safe to stop sending people to the local
	 * settings page.
	 */

	return (
		<PageVisibility onChange={ debouncedRefresh }>
			<a
				className={ styles[ 'settings-link' ] }
				href={ connectionsAdminUrl }
				target="_blank"
				rel="noreferrer"
				title={ __( 'Connect an account', 'jetpack' ) }
			>
				<svg
					width="24"
					height="24"
					viewBox="0 0 28 28"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect x="0.375" y="0.375" width="27.25" height="27.25" rx="1.125" fill="#F6F7F7" />
					<path
						d="M19 13.3333H14.6667V9H13.3333V13.3333H9V14.6667H13.3333V19H14.6667V14.6667H19V13.3333Z"
						fill="black"
					/>
					<rect
						x="0.375"
						y="0.375"
						width="27.25"
						height="27.25"
						rx="1.125"
						stroke="#A7AAAD"
						strokeWidth="0.75"
						strokeDasharray="2 2"
					/>
				</svg>
			</a>
		</PageVisibility>
	);
}
