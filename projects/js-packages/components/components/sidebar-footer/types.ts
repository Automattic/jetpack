import type { ReactNode } from 'react';

export type SidebarFooterProps = {
	/**
	 * The actions, usually one or two buttons. Each gets an equal-width column and fills it.
	 */
	children: ReactNode;
	/**
	 * Shown above the actions, such as a note on what an action is doing.
	 */
	description?: ReactNode;
	/**
	 * Extra class name for the footer.
	 */
	className?: string;
};
