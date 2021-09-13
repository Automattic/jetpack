/**
 * WordPress dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { svg as jetpackColophonSvg } from '../../../instant-search/components/jetpack-colophon';
import { addQueryArgs } from '@wordpress/url';

/**
 * Description tab for the sidebar.
 *
 * @returns {Element} component instance
 */
export default function SidebarDescription() {
	return (
		<div className="jp-search-configure-sidebar-description">
			<BlockIcon icon={ jetpackColophonSvg } />
			<div>
				<p>
					{ __(
						'Jetpack Instant Search will allow your visitors to get search results as soon as they start typing. Customize this experience to offer better results that match your site.',
						'jetpack'
					) }
				</p>
				<Button href={ 'widgets.php' } isTertiary>
					{ __( 'Edit widgets', 'jetpack' ) }
				</Button>
				<Button
					href={ addQueryArgs( 'customize.php', {
						'autofocus[section]': 'jetpack_search',
						return: `${ window.location.pathname }${ window.location.search }`,
					} ) }
					isTertiary
				>
					{ __( 'Configure in the Customizer', 'jetpack' ) }
				</Button>
			</div>
		</div>
	);
}
