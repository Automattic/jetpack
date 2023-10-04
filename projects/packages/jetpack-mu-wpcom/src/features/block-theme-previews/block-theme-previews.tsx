import { useDispatch, useSelect } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import { __, sprintf } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';
import { getQueryArg } from '@wordpress/url';
import React, { useEffect } from 'react';

/**
 * Return true if the user is currently previewing a theme.
 * @returns {boolean} isPreviewingTheme
 */
function isPreviewingTheme() {
	return getQueryArg( window.location.href, 'wp_theme_preview' ) !== undefined;
}

/**
 * Return the theme slug if the user is currently previewing a theme.
 * @returns {string|null} currentlyPreviewingTheme
 */
function currentlyPreviewingTheme() {
	if ( isPreviewingTheme() ) {
		return getQueryArg( window.location.href, 'wp_theme_preview' );
	}
	return null;
}

/**
 * Sometimes Gutenberg doesn't allow you to re-register the module and throws an error.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let unlock: ( object: any ) => any | undefined;
try {
	unlock = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.',
		'@wordpress/edit-site'
	).unlock;
} catch ( error ) {
	// eslint-disable-next-line no-console
	console.error( 'Error: Unable to get the unlock api. Reason: %s', error );
}

const NOTICE_ID = 'jetpack-mu-wpcom/notice';

const BlockThemePreviewNotice = () => {
	const { createWarningNotice } = useDispatch( 'core/notices' );
	const { dashboardLink, previewingTheme } = useSelect( select => {
		const { getSettings } = unlock( select( 'core/edit-site' ) );
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const theme = ( select( 'core' ) as any ).getTheme( currentlyPreviewingTheme() );
		return {
			previewingTheme: theme?.name?.rendered || 'new',
			dashboardLink: getSettings().__experimentalDashboardLink,
		};
	}, [] );
	useEffect( () => {
		createWarningNotice(
			sprintf(
				// translators: %s: theme name
				__( 'You are currently live-previewing the %s theme.', 'jetpack-mu-wpcom' ),
				previewingTheme
			),
			{
				id: NOTICE_ID,
				actions: [
					{
						label: __( 'Back to Themes', 'jetpack-mu-wpcom' ),
						onClick: () => {
							window.location.href = dashboardLink;
						},
						variant: 'primary',
					},
				],
			}
		);
	}, [ dashboardLink, createWarningNotice ] );
	return null;
};

const registerBlockThemePreviewPlugin = () => {
	registerPlugin( 'jetpack-mu-wpcom', {
		render: () => (
			<>
				<BlockThemePreviewNotice />
			</>
		),
	} );
};

domReady( () => {
	registerBlockThemePreviewPlugin();
} );
