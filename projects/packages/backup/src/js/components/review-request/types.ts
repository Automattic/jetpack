export type ReviewRequestBaseProps = {
	href: string;
	cta: string;
	onClick: () => void;
	requestReason: string;
	reviewText: string;
	dismissedReview?: boolean;
	dismissMessage?: VoidFunction;
};
