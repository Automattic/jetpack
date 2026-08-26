export type AdminMenuItem = {
	id: string;
	label: string;
	menuSlug: string;
	order: number;
	hasSavedOrder: boolean;
	customizable: boolean;
	hidden: boolean;
	external: boolean;
	group?: string;
	groupLabel?: string;
};

export type AdminMenuItemPreference = {
	hidden?: boolean;
	order?: number;
};

export type AdminMenuSeparator = {
	id: string;
	title: string;
	order: number;
};

export type AdminMenuLayout = {
	enabled?: boolean;
	items: Record< string, AdminMenuItemPreference >;
	separators: Record< string, AdminMenuSeparator >;
};

export type AdminMenuModel = {
	featureEnabled: boolean;
	active: boolean;
	hasPersonalLayout: boolean;
	siteLayout: AdminMenuLayout;
	userLayout: AdminMenuLayout;
	separators: Record< string, AdminMenuSeparator >;
	items: AdminMenuItem[];
};

export type MenuItemNode = AdminMenuItem & {
	type: 'item';
	locked: boolean;
};

export type MenuSeparatorNode = AdminMenuSeparator & {
	type: 'separator';
	base: boolean;
	locked: boolean;
};

export type MenuNode = MenuItemNode | MenuSeparatorNode;

export type NoticeState = {
	intent: 'success' | 'error';
	message: string;
};
