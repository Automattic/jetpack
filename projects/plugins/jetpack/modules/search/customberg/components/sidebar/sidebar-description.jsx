/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { blockDefault } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';

/**
 * Description tab for the sidebar.
 *
 * @returns {React.Element} component instance
 */
export default function SidebarDescription() {
	return (
		<div className="jp-search-customize-sidebar-description">
			<BlockIcon icon={ blockDefault } />
			<div>
				<p>
					{ __(
						'Jetpack Instant Search will allow your visitors to get search results as soon as they start typing. Customize this experience to offer better results that match your site.',
						'jetpack'
					) }
				</p>
				<Button
					href={ addQueryArgs( 'customize.php', {
						'autofocus[section]': 'jetpack_search',
						return: `${ window.location.pathname }${ window.location.search }`,
					} ) }
					isTertiary
				>
					{ __( 'Manage with live preview' ) }
				</Button>
			</div>
		</div>
	);
}
