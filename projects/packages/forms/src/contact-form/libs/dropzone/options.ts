export interface DropzoneOptions {
	endpoint: string;
	nonce: string;
	wp_nonce: string;
	jp_nonce: string;
	i18n?: {
		language?: string;
		fileSizeUnits?: string[];
		removeFile?: string;
		uploadError?: string;
		unsupportedFiletype?: string;
		folderNotSupported?: string;
	};
}
