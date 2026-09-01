import { __, _x } from '@wordpress/i18n';

type FooterMenuItem = {
	href?: string;
	label: string;
	onClick?: () => void;
	onKeyDown?: ( event: KeyboardEvent ) => void;
	title?: string;
};

type BuildOptionalMenuItemsArgs = {
	adminUrl: string;
	isDevVersion: boolean;
	userIsAdmin: boolean;
	isSiteConnected: boolean;
	isJetpackPluginActive: boolean;
	isSimpleSite: boolean;
	onModulesClick: () => void;
	onResetClick: () => void;
	onResetKeyDown: ( event: KeyboardEvent ) => void;
};

const buildOptionalMenuItems = ( {
	adminUrl,
	isDevVersion,
	userIsAdmin,
	isSiteConnected,
	isJetpackPluginActive,
	isSimpleSite,
	onModulesClick,
	onResetClick,
	onResetKeyDown,
}: BuildOptionalMenuItemsArgs ): FooterMenuItem[] => {
	const items: FooterMenuItem[] = [];

	// The jetpack_modules admin page is not registered on WordPress.com Simple sites,
	// so the link would 404 there.
	if ( userIsAdmin && isSiteConnected && isJetpackPluginActive && ! isSimpleSite ) {
		items.push( {
			label: _x(
				'Modules',
				'Navigation item. Noun. Links to a list of modules for Jetpack.',
				'jetpack-my-jetpack'
			),
			title: __(
				'Access the full list of Jetpack modules available on your site.',
				'jetpack-my-jetpack'
			),
			href: `${ adminUrl }admin.php?page=jetpack_modules`,
			onClick: onModulesClick,
		} );
	}

	if ( isDevVersion && userIsAdmin ) {
		items.push( {
			label: 'Reset options (devs)',
			onClick: onResetClick,
			onKeyDown: onResetKeyDown,
		} );
	}

	return items;
};

export default buildOptionalMenuItems;
