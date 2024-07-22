declare global {
	interface Window {
		wpcomGutenberg: {
			blogPublic: string;
		};
		newspack_blocks_data: {
			assets_path: string;
			is_rendering_stripe_payment_form?: boolean;
			supports_recaptcha: boolean;
			has_recaptcha: boolean;
			recaptcha_url: string;
		};
		grecaptcha: any;
		newspackReaderActivation: {
			on: Function;
			off: Function;
			setReaderEmail: Function;
			setAuthenticated: Function;
			refreshAuthentication: Function;
			getReader: Function;
			hasAuthLink: Function;
			setAuthStrategy: Function;
			getAuthStrategy: Function;
		};
	}

	type PostId = number;
	type CategoryId = number;
	type TagId = number;
	type Taxonomy = { slug: string; terms: number[] }[];
	type AuthorId = number;

	type PostType = { name: string; slug: string; supports: { newspack_blocks: boolean } };

	// As used by Newspack_Blocks_API::posts_endpoint.
	type PostsQuery = {
		include?: PostId[];
		excerptLength?: number;
		showExcerpt?: boolean;
	};

	type Block = {
		name: string;
		clientId: string;
		attributes: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			[ key: string ]: any;
		};
		innerBlocks: Block[];
	};

	type Post = {
		id: number;
	};
}

export {};
