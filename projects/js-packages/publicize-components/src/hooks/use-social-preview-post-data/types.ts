export type PostData = {
	title: string;
	description: string;
	url: string;
	excerpt: string;
	image: string;
	media: Array< {
		type: string;
		url: string;
		alt?: string;
	} >;
};
