import { __ } from '@wordpress/i18n';
import { connect } from 'react-redux';
import Button from 'components/button';
import Card from 'components/card';
import { isModuleFound as isModuleFoundSelector } from 'state/search';

/**
 * Surfaces the new Newsletter settings page in Jetpack Settings search results.
 *
 * The Newsletter settings UI used to live here but has moved to its own
 * wp-admin page. This card keeps the settings discoverable when someone
 * searches for newsletter-related terms from Jetpack Settings.
 *
 * @param {object}  props                            - Component props.
 * @param {string}  props.searchTerm                 - Current search term.
 * @param {boolean} props.isSubscriptionsModuleFound - Whether the subscriptions module matches the search term.
 * @param {string}  props.siteAdminUrl               - URL to the wp-admin root.
 * @return {import('react').ReactNode} The redirect card, or null when not shown.
 */
function Subscriptions( { searchTerm, isSubscriptionsModuleFound, siteAdminUrl } ) {
	if ( ! searchTerm || ! isSubscriptionsModuleFound ) {
		return null;
	}

	return (
		<div>
			<h1 className="screen-reader-text">{ __( 'Jetpack Newsletter Settings', 'jetpack' ) }</h1>
			<h2 className="jp-settings__section-title">{ __( 'Newsletter', 'jetpack' ) }</h2>
			<Card>
				<p>
					{ __(
						'Newsletter Settings have moved to a new location. Access it via Jetpack → Newsletter.',
						'jetpack'
					) }
				</p>
				<Button href={ `${ siteAdminUrl }admin.php?page=jetpack-newsletter` } primary rna>
					{ __( 'Go to Newsletter Settings', 'jetpack' ) }
				</Button>
			</Card>
		</div>
	);
}

export default connect( state => ( {
	isSubscriptionsModuleFound: isModuleFoundSelector( state, 'subscriptions' ),
} ) )( Subscriptions );
