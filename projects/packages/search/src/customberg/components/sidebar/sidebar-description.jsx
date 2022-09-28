import { BlockIcon } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { svg as jetpackColophonSvg } from 'instant-search/components/jetpack-colophon';

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
						'Jetpack Search will allow your visitors to get search results as soon as they start typing. Customize this experience to offer better results that match your site.',
						'jetpack-search-pkg'
					) }
				</p>
				<Button href={ 'widgets.php' } variant="tertiary">
					{ __( 'Edit widgets', 'jetpack-search-pkg' ) }
				</Button>
				<Button
					href={ addQueryArgs( 'customize.php', {
						'autofocus[section]': 'jetpack_search',
						return: `${ window.location.pathname }${ window.location.search }`,
					} ) }
					variant="tertiary"
				>
					{ __( 'Configure in the Customizer', 'jetpack-search-pkg' ) }
				</Button>
			</div>
		</div>
	);
}
