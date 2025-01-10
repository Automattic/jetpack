declare global {
	interface Window {
		wpcomGutenberg: {
			blogPublic: string;
		};
		newspack_blocks_data: {
			assets_path: string;
			supports_recaptcha: boolean;
			has_recaptcha: boolean;
			recaptcha_url: string;
			post_subtitle: boolean;
			can_use_name_your_price: boolean;
			tier_amounts_template: string;
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
		showCaption?: boolean,
		showCredit?: boolean,
	};

	type Block = {
		name: string;
		clientId: string;
		attributes: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			[key: string]: any;
		};
		innerBlocks: Block[];
	};

	type Post = {
		id: number;
		title: {
			rendered: string;
		};
		post_type: string;
		date: string;
		date_formatted: string;
		article_meta_footer: string;
		excerpt: {
			rendered: string;
		};
		full_content: string;
		meta: {
			newspack_post_subtitle: string;
		};
		post_link: string;
		newspack_author_info: {
			id: number;
			author_link: string;
			avatar: string;
		}[];
		newspack_article_classes: string;
		newspack_featured_image_caption: string;
		newspack_featured_image_src: {
			large: string;
			landscape: string;
			portrait: string;
			square: string;
			uncropped: string;
		};
		newspack_category_info: string;
		newspack_sponsors_show_categories: boolean;
		newspack_sponsors_show_author: boolean;
		newspack_post_sponsors?:
		| {
			flag: string;
		}[]
		| false;
		newspack_listings_hide_author?: boolean;
		newspack_listings_hide_publish_date?: boolean;
	};

	type HomepageArticlesAttributes = {
		postsToShow: number;
		authors: AuthorId[];
		categories: CategoryId[];
		includeSubcategories: boolean;
		excerptLength: number;
		postType: PostType[];
		showImage: boolean;
		showExcerpt: boolean;
		showFullContent: boolean;
		tags: TagId[];
		customTaxonomies: Taxonomy[];
		specificPosts: string[];
		specificMode: boolean;
		tagExclusions: TagId[];
		categoryExclusions: CategoryId[];
		customTaxonomyExclusions: Taxonomy[];
		className: string;
		excerptLength: number;
		showReadMore: boolean;
		readMoreLabel: string;
		showDate: boolean;
		showImage: boolean;
		showCaption: boolean;
		showCredit: boolean;
		disableImageLazyLoad: boolean;
		fetchPriority: string;
		imageShape: string;
		minHeight: integer;
		moreButton: boolean;
		infiniteScroll: boolean;
		moreButtonText: string;
		showAuthor: boolean;
		showAvatar: boolean;
		showCategory: boolean;
		postLayout: string;
		columns: integer;
		colGap: integer;
		postsToShow: integer;
		mediaPosition: string;
		showSubtitle: boolean;
		sectionHeader: string;
		imageScale: number;
		mobileStack: boolean;
		typeScale: number;
		textAlign: string;
		deduplicate: boolean;
	};

	type HomepageArticlesAttributesKey = keyof HomepageArticlesAttributes;

	type HomepageArticlesPropsFromDataSelector = {
		topBlocksClientIdsInOrder: Block['clientId'][];
		latestPosts: Post[];
		isEditorBlock: boolean;
		isUIDisabled: boolean;
		error: undefined | string;
	};

	type HomepageArticlesProps = HomepageArticlesPropsFromDataSelector & {
		attributes: HomepageArticlesAttributes;
		setAttributes: (attributes: Partial<HomepageArticlesAttributes>) => void;
		textColor: {
			color: string;
		};
		setTextColor: (color: string) => void;
		triggerReflow: () => void;
		className: string;
		isSelected: boolean;
	};
}

export { };
