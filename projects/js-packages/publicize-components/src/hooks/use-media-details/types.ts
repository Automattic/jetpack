export type MediaDetails = {
	metaData: {
		mime: string;
		fileSize: number;
		length: number;
	};
	mediaData: {
		width: number;
		height: number;
		sourceUrl: string;
	};
};
