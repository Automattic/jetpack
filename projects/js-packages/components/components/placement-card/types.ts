import type { ReactNode } from 'react';

export type PlacementCardProps = {
	/**
	 * Id of the checkbox; the illustration's label points at it.
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
	 * Wireframe of the placement, drawn at a 294×192 aspect ratio.
	 */
	illustration?: ReactNode;
	/**
	 * Whether the placement is selected.
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

export type PlacementCardGridProps = {
	/**
	 * The `PlacementCard`s to lay out.
	 */
	children: ReactNode;
	/**
	 * Extra class for the grid.
	 */
	className?: string;
};
