import type { ReactNode } from 'react';

export type CheckboxCardProps = {
	/**
	 * Id of the checkbox; the title's id is built from it.
	 */
	id: string;
	/**
	 * Passed back to `onChange` and `onPreviewClick`, so one handler can serve every card.
	 */
	name: string;
	/**
	 * Caption under the card, and the checkbox's accessible name.
	 */
	title: string;
	/**
	 * Picture filling the card, drawn at a 294×192 aspect ratio.
	 */
	illustration?: ReactNode;
	/**
	 * Whether the card is checked.
	 */
	checked: boolean;
	/**
	 * Called with the card's `name` and the next checked value.
	 */
	onChange: ( name: string, next: boolean ) => void;
	/**
	 * Shows a "Preview and edit" link to this URL under the title.
	 */
	previewUrl?: string;
	/**
	 * Called with the card's `name` when the "Preview and edit" link is clicked.
	 */
	onPreviewClick?: ( name: string ) => void;
	/**
	 * Disables the checkbox.
	 */
	disabled?: boolean;
};

export type CheckboxCardGridProps = {
	/**
	 * The `CheckboxCard`s to lay out.
	 */
	children: ReactNode;
	/**
	 * Extra class for the grid.
	 */
	className?: string;
};
