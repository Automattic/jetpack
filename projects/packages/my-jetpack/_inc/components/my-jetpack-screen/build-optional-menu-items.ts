import { __, _x } from '@wordpress/i18n';
import { MyJetpackRoutes } from '../../constants';

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

	// The Features list view replaces the Modules screen. Simple sites already show only Features.
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
			href: `${ adminUrl }admin.php?page=my-jetpack#${ MyJetpackRoutes.Features }?view=list`,
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
