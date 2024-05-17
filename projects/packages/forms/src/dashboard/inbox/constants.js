export const RESPONSES_FETCH_LIMIT = 50;

export const TABS = {
	inbox: 'inbox',
	spam: 'spam',
	trash: 'trash',
};

export const ACTIONS = {
	moveToTrash: 'trash',
	removeFromTrash: 'untrash',
	delete: 'delete',
	markAsSpam: 'mark_as_spam',
	markAsNotSpam: 'mark_as_not_spam',
};

export const ACTION_TABS = {
	[ ACTIONS.moveToTrash ]: TABS.trash,
	[ ACTIONS.removeFromTrash ]: TABS.inbox,
	[ ACTIONS.markAsSpam ]: TABS.spam,
	[ ACTIONS.markAsNotSpam ]: TABS.inbox,
};
