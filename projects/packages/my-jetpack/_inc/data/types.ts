export type CamelCase< S extends string > = S extends `${ infer P1 }-${ infer P2 }${ infer P3 }`
	? `${ P1 }${ Uppercase< P2 > }${ CamelCase< P3 > }`
	: S extends `${ infer P1 }_${ infer P2 }${ infer P3 }`
	? `${ P1 }${ Uppercase< P2 > }${ CamelCase< P3 > }`
	: S;

export type ToCamelCase< T > = T extends Array< infer U >
	? Array< ToCamelCase< U > >
	: T extends object
	? { [ K in keyof T as CamelCase< string & K > ]: ToCamelCase< T[ K ] > }
	: T;

export type BackupCountStats = {
	total_post_count: number;
	total_page_count: number;
	total_comment_count: number;
	total_image_count: number;
	total_video_count: number;
	total_audio_count: number;
};

type StateProducts = Window[ 'myJetpackInitialState' ][ 'products' ][ 'items' ];
export type ProductSnakeCase = StateProducts[ string ];

export type ProductCamelCase = ToCamelCase< ProductSnakeCase > & {
	pricingForUi: ToCamelCase< ProductSnakeCase[ 'pricing_for_ui' ] > & {
		fullPricePerMonth: number;
		discountPricePerMonth: number;
	};
};

export type WP_Error = {
	code: string;
	message: string;
	data: {
		status: number;
	};
};
