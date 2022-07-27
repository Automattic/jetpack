export type ReviewRequestBaseProps = {
	description: string;
	cta: string;
	onClick: () => void;
	isDismissed: boolean;
	onDissmiss: () => void;
};
