export type TrimCutModalProps = {
	guid: string;
	attachmentId: number;
	title?: string;
	onClose: () => void;
	onProcessed: () => void;
};
