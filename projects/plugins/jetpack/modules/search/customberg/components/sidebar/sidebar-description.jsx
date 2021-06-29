/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { blockDefault } from '@wordpress/icons';
import { BlockIcon } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Description tab for the sidebar.
 *
 * @returns {React.Element} component instance
 */
export default function SidebarDescription() {
	const description = __(
		'Jetpack Instant Search will allow your visitors to get search results as soon as they start typing. Customize this experience to offer better results that match your site.',
		'jetpack'
	);

	return (
		<div className="jp-search-customize-sidebar-description">
			<BlockIcon icon={ blockDefault } />
			<div>
				<p>{ description }</p>
			</div>
		</div>
	);
}
