type FooterMenuItem = {
	href?: string;
	label: string;
	onClick?: () => void;
	onKeyDown?: ( event: KeyboardEvent ) => void;
	title?: string;
};

type BuildOptionalMenuItemsArgs = {
	isDevVersion: boolean;
	userIsAdmin: boolean;
	onResetClick: () => void;
	onResetKeyDown: ( event: KeyboardEvent ) => void;
};

const buildOptionalMenuItems = ( {
	isDevVersion,
	userIsAdmin,
	onResetClick,
	onResetKeyDown,
}: BuildOptionalMenuItemsArgs ): FooterMenuItem[] => {
	const items: FooterMenuItem[] = [];

	// The Modules screen is deliberately not linked from here: it stays reachable at
	// `admin.php?page=jetpack_modules` for comparison while the Features list is being
	// explored, but is no longer somewhere this page will take you.

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
