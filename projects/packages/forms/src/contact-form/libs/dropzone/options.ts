export interface DropzoneOptions {
	endpoint: string;
	wp_nonce: string;
	jp_nonce: string;
	maxUploadSize: number;
	i18n?: {
		language?: string;
		fileSizeUnits?: string[];
		removeFile?: string;
		uploadError?: string;
		fileTooLarge?: string;
		folderNotSupported?: string;
		unsupportedFiletype?: string;
	};
}
