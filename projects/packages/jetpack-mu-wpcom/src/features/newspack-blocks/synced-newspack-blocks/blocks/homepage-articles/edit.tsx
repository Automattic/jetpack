/* eslint-disable jsx-a11y/anchor-is-valid, @typescript-eslint/no-explicit-any */

/**
 * Internal dependencies
 */
import QueryControls from '../../components/query-controls';
import { postsBlockSelector, postsBlockDispatch, isBlogPrivate, shouldReflow } from './utils';
import {
	formatAvatars,
	formatByline,
	formatSponsorLogos,
	formatSponsorByline,
	getPostStatusLabel,
} from '../../shared/js/utils';
import { PostTypesPanel, PostStatusesPanel } from '../../components/editor-panels';

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component, Fragment, RawHTML } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	PanelColorSettings,
	RichText,
	withColors,
	AlignmentControl,
} from '@wordpress/block-editor';
import {
	BaseControl,
	Button,
	ButtonGroup,
	PanelBody,
	Path,
	Placeholder,
	RangeControl,
	Spinner,
	SVG,
	Toolbar,
	ToggleControl,
	TextControl,
} from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';
import {
	fullscreen,
	grid,
	image,
	list,
	postFeaturedImage,
	pullLeft,
	pullRight,
	sidesAll,
	textColor as typeScaleIcon,
} from '@wordpress/icons';

let IS_SUBTITLE_SUPPORTED_IN_THEME: boolean;
if (
	typeof window === 'object' &&
	window.newspack_blocks_data &&
	window.newspack_blocks_data.post_subtitle
) {
	IS_SUBTITLE_SUPPORTED_IN_THEME = true;
}

const landscapeIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path
			clipRule="evenodd"
			d="M18.714 7.5H5.286a.786.786 0 00-.786.786v7.428c0 .434.352.786.786.786h13.428a.786.786 0 00.786-.786V8.286a.786.786 0 00-.786-.786zM5.286 6A2.286 2.286 0 003 8.286v7.428A2.286 2.286 0 005.286 18h13.428A2.286 2.286 0 0021 15.714V8.286A2.286 2.286 0 0018.714 6H5.286z"
			fillRule="evenodd"
		/>
	</SVG>
);

const portraitIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path
			clipRule="evenodd"
			d="M15.714 4.5H8.286a.786.786 0 00-.786.786v13.428c0 .434.352.786.786.786h7.428a.786.786 0 00.786-.786V5.286a.786.786 0 00-.786-.786zM8.286 3A2.286 2.286 0 006 5.286v13.428A2.286 2.286 0 008.286 21h7.428A2.286 2.286 0 0018 18.714V5.286A2.286 2.286 0 0015.714 3H8.286z"
			fillRule="evenodd"
		/>
	</SVG>
);

const squareIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path
			clipRule="evenodd"
			d="M18.714 4.5H5.286a.786.786 0 00-.786.786v13.428c0 .434.352.786.786.786h13.428a.786.786 0 00.786-.786V5.286a.786.786 0 00-.786-.786zM5.286 3A2.286 2.286 0 003 5.286v13.428A2.286 2.286 0 005.286 21h13.428A2.286 2.286 0 0021 18.714V5.286A2.286 2.286 0 0018.714 3H5.286z"
			fillRule="evenodd"
		/>
	</SVG>
);

class Edit extends Component< HomepageArticlesProps > {
	renderPost = ( post: Post ) => {
		const { attributes, isUIDisabled } = this.props;
		const {
			showImage,
			imageShape,
			mediaPosition,
			minHeight,
			showCaption,
			showCredit,
			showExcerpt,
			showFullContent,
			showReadMore,
			readMoreLabel,
			showSubtitle,
			showAuthor,
			showAvatar,
			showDate,
			showCategory,
			sectionHeader,
		} = attributes;

		const styles = {
			minHeight:
				( mediaPosition === 'behind' &&
					showImage &&
					post.newspack_featured_image_src &&
					minHeight + 'vh' ) ||
				undefined,
			paddingTop:
				( mediaPosition === 'behind' &&
					showImage &&
					post.newspack_featured_image_src &&
					minHeight / 5 + 'vh' ) ||
				undefined,
		};

		const postClasses = classNames(
			{
				'post-has-image': post.newspack_featured_image_src,
				'newspack-block--disabled': isUIDisabled,
			},
			post.newspack_article_classes
		);

		const postTitle = this.titleForPost( post );
		return (
			<article className={ postClasses } key={ post.id } style={ styles }>
				{ getPostStatusLabel( post ) }
				{ showImage && post.newspack_featured_image_src && (
					<figure className="post-thumbnail" key="thumbnail">
						<a href="#">
							{ imageShape === 'landscape' && (
								<img src={ post.newspack_featured_image_src.landscape } alt="" />
							) }
							{ imageShape === 'portrait' && (
								<img src={ post.newspack_featured_image_src.portrait } alt="" />
							) }
							{ imageShape === 'square' && (
								<img src={ post.newspack_featured_image_src.square } alt="" />
							) }
							{ imageShape === 'uncropped' && (
								<img src={ post.newspack_featured_image_src.uncropped } alt="" />
							) }
						</a>
						{ ( showCaption || showCredit ) && (
							<div
								dangerouslySetInnerHTML={ {
									__html: post.newspack_featured_image_caption,
								} }
							/>
						) }
					</figure>
				) }

				<div className="entry-wrapper">
					{ ( post.newspack_post_sponsors ||
						( showCategory && 0 < post.newspack_category_info.length ) ) && (
						<div
							className={ 'cat-links' + ( post.newspack_post_sponsors ? ' sponsor-label' : '' ) }
						>
							{ post.newspack_post_sponsors && (
								<span className="flag">{ post.newspack_post_sponsors[ 0 ].flag }</span>
							) }
							{ showCategory &&
								( ! post.newspack_post_sponsors || post.newspack_sponsors_show_categories ) && (
								<RawHTML>{ decodeEntities( post.newspack_category_info ) }</RawHTML>
							) }
						</div>
					) }
					{ RichText.isEmpty( sectionHeader ) ? (
						<h2 className="entry-title" key="title">
							<a href="#">{ postTitle }</a>
						</h2>
					) : (
						<h3 className="entry-title" key="title">
							<a href="#">{ postTitle }</a>
						</h3>
					) }
					{ IS_SUBTITLE_SUPPORTED_IN_THEME && showSubtitle && (
						<RawHTML
							key="subtitle"
							className="newspack-post-subtitle newspack-post-subtitle--in-homepage-block"
						>
							{ post.meta.newspack_post_subtitle || '' }
						</RawHTML>
					) }
					{ showExcerpt && ! showFullContent && (
						<RawHTML key="excerpt" className="excerpt-contain">
							{ post.excerpt.rendered }
						</RawHTML>
					) }
					{ ! showExcerpt && showFullContent && (
						<RawHTML key="full-content" className="excerpt-contain">
							{ post.full_content }
						</RawHTML>
					) }
					{ showReadMore && post.post_link && (
						<a href="#" key="readmore" className="more-link">
							{ readMoreLabel }
						</a>
					) }
					<div className="entry-meta">
						{ post.newspack_post_sponsors && (
							<span
								className={ `entry-sponsors ${
									post.newspack_sponsors_show_author ? 'plus-author' : ''
								}` }
							>
								{ formatSponsorLogos( post.newspack_post_sponsors ) }
								{ formatSponsorByline( post.newspack_post_sponsors ) }
							</span>
						) }

						{ showAuthor &&
							! post.newspack_listings_hide_author &&
							showAvatar &&
							( ! post.newspack_post_sponsors || post.newspack_sponsors_show_author ) &&
							formatAvatars( post.newspack_author_info ) }

						{ showAuthor &&
							! post.newspack_listings_hide_author &&
							( ! post.newspack_post_sponsors || post.newspack_sponsors_show_author ) &&
							formatByline( post.newspack_author_info ) }

						{ showDate && ! post.newspack_listings_hide_publish_date && (
							<time className="entry-date published" key="pub-date">
								{ post.date_formatted }
							</time>
						) }
						{ post.article_meta_footer ? <RawHTML>{ post.article_meta_footer }</RawHTML> : null }
					</div>
				</div>
			</article>
		);
	};

	titleForPost = ( post: Post ) => {
		if ( ! post.title ) {
			return '';
		}
		if ( typeof post.title === 'object' && post.title.rendered ) {
			return decodeEntities( post.title.rendered.trim() );
		}
	};

	renderInspectorControls = () => {
		const { attributes, setAttributes } = this.props;

		const {
			authors,
			specificPosts,
			postsToShow,
			categories,
			includeSubcategories,
			customTaxonomies,
			columns,
			postType,
			showImage,
			showCaption,
			showCredit,
			imageScale,
			mobileStack,
			minHeight,
			moreButton,
			infiniteScroll,
			showExcerpt,
			showFullContent,
			showReadMore,
			readMoreLabel,
			excerptLength,
			showSubtitle,
			showDate,
			showAuthor,
			showAvatar,
			showCategory,
			postLayout,
			mediaPosition,
			specificMode,
			tags,
			tagExclusions,
			categoryExclusions,
			customTaxonomyExclusions,
		} = attributes;

		const imageSizeOptions = [
			{
				value: 1,
				label: /* translators: label for small size option */ __( 'Small', 'jetpack-mu-wpcom' ),
				shortName: /* translators: abbreviation for small size */ __( 'S', 'jetpack-mu-wpcom' ),
			},
			{
				value: 2,
				label: /* translators: label for medium size option */ __( 'Medium', 'jetpack-mu-wpcom' ),
				shortName: /* translators: abbreviation for medium size */ __( 'M', 'jetpack-mu-wpcom' ),
			},
			{
				value: 3,
				label: /* translators: label for large size option */ __( 'Large', 'jetpack-mu-wpcom' ),
				shortName: /* translators: abbreviation for large size */ __( 'L', 'jetpack-mu-wpcom' ),
			},
			{
				value: 4,
				label: /* translators: label for extra large size option */ __(
					'Extra Large',
					'jetpack-mu-wpcom'
				),
				shortName: /* translators: abbreviation for extra large size */ __(
					'XL',
					'jetpack-mu-wpcom'
				),
			},
		];

		const handleAttributeChange = ( key: HomepageArticlesAttributesKey ) => ( value: any ) =>
			setAttributes( { [ key ]: value } );

		return (
			<Fragment>
				{ postLayout === 'grid' && (
					<PanelBody title={ __( 'Grid', 'jetpack-mu-wpcom' ) }>
						<RangeControl
							label={ __( 'Columns', 'jetpack-mu-wpcom' ) }
							value={ columns }
							onChange={ handleAttributeChange( 'columns' ) }
							min={ 2 }
							max={ 6 }
							required
							__next40pxDefaultSize
						/>
					</PanelBody>
				) }
				<PanelBody title={ __( 'Content', 'jetpack-mu-wpcom' ) } className="newspack-block__panel is-content">
					<QueryControls
						numberOfItems={ postsToShow }
						onNumberOfItemsChange={ ( _postsToShow: number ) =>
							setAttributes( { postsToShow: _postsToShow || 1 } )
						}
						specificMode={ specificMode }
						onSpecificModeChange={ () => setAttributes( { specificMode: true } ) }
						onLoopModeChange={ () => setAttributes( { specificMode: false } ) }
						specificPosts={ specificPosts }
						onSpecificPostsChange={ handleAttributeChange( 'specificPosts' ) }
						authors={ authors }
						onAuthorsChange={ handleAttributeChange( 'authors' ) }
						categories={ categories }
						onCategoriesChange={ handleAttributeChange( 'categories' ) }
						includeSubcategories={ includeSubcategories }
						onIncludeSubcategoriesChange={ handleAttributeChange( 'includeSubcategories' ) }
						tags={ tags }
						onTagsChange={ handleAttributeChange( 'tags' ) }
						onCustomTaxonomiesChange={ handleAttributeChange( 'customTaxonomies' ) }
						customTaxonomies={ customTaxonomies }
						tagExclusions={ tagExclusions }
						onTagExclusionsChange={ handleAttributeChange( 'tagExclusions' ) }
						categoryExclusions={ categoryExclusions }
						onCategoryExclusionsChange={ handleAttributeChange( 'categoryExclusions' ) }
						customTaxonomyExclusions={ customTaxonomyExclusions }
						onCustomTaxonomyExclusionsChange={ handleAttributeChange( 'customTaxonomyExclusions' ) }
						postType={ postType }
					/>
					<ToggleControl
						label={ __( 'Allow duplicate stories', 'jetpack-mu-wpcom' ) }
						help={ __(
							"Exclude this block from the page's deduplication logic.",
							'jetpack-mu-wpcom'
						) }
						checked={ ! attributes.deduplicate }
						onChange={ ( value: boolean ) => setAttributes( { deduplicate: ! value } ) }
					/>
					{ ! specificMode && isBlogPrivate() ? (
						/*
						 * Hide the "Load more posts" button option on private sites.
						 *
						 * Client-side fetching from a private WP.com blog requires authentication,
						 * which is not provided in the current implementation.
						 * See https://github.com/Automattic/newspack-blocks/issues/306.
						 */
						<ToggleControl
							label={ __( 'Show "Load more posts" button', 'jetpack-mu-wpcom' ) }
							help={ __( 'This site is private, therefore this feature is not active.', 'jetpack-mu-wpcom' ) }
							disabled={ true }
						/>
					) : (
						! specificMode && (
							<>
								<ToggleControl
									label={ __( 'Show "Load more posts" button', 'jetpack-mu-wpcom' ) }
									checked={ moreButton }
									onChange={ () => setAttributes( { moreButton: ! moreButton } ) }
								/>
								<ToggleControl
									label={ __( 'Infinite scroll', 'jetpack-mu-wpcom' ) }
									checked={ infiniteScroll }
									disabled={ ! moreButton }
									onChange={ () => setAttributes( { infiniteScroll: ! infiniteScroll } ) }
								/>
							</>
						)
					) }
				</PanelBody>
				<PanelBody title={ __( 'Display', 'jetpack-mu-wpcom' ) } className="newspack-block__panel">
					<BaseControl
						label={ __( 'Text', 'jetpack-mu-wpcom' ) }
						id="newspack-block__content-display"
						className="newspack-block__button-group"
					>
						<ButtonGroup>
							<Button
								variant={ ! showExcerpt && ! showFullContent && 'primary' }
								aria-pressed={ ! showExcerpt && ! showFullContent }
								onClick={ () => {
									setAttributes( {
										showExcerpt: false,
										showFullContent: false
									} )
								} }
							>
								{ __( 'None', 'jetpack-mu-wpcom' ) }
							</Button>
							<Button
								variant={ showExcerpt && ! showFullContent && 'primary' }
								aria-pressed={ showExcerpt && ! showFullContent }
								onClick={ () => {
									setAttributes( {
										showExcerpt: ! showExcerpt,
										showFullContent: showFullContent ? false : showFullContent
									} )
								} }
							>
								{ __( 'Excerpt', 'jetpack-mu-wpcom' ) }
							</Button>
							<Button
								variant={ ! showExcerpt && showFullContent && 'primary' }
								aria-pressed={ ! showExcerpt && showFullContent }
								onClick={ () => {
									setAttributes( {
										showFullContent: ! showFullContent,
										showExcerpt: showExcerpt ? false : showExcerpt
									} )
								} }
							>
								{ __( 'Full Post', 'jetpack-mu-wpcom' ) }
							</Button>
						</ButtonGroup>
					</BaseControl>
					{ showExcerpt && (
						<RangeControl
							label={ __( 'Max number of words in excerpt', 'jetpack-mu-wpcom' ) }
							value={ excerptLength }
							onChange={ ( value: number ) => setAttributes( { excerptLength: value } ) }
							min={ 10 }
							max={ 100 }
							__next40pxDefaultSize
						/>
					) }
					{ ! showFullContent && (
						<ToggleControl
							label={
								sprintf(
									// translators: %s is the read more label'.
									__( 'Show "%s" link', 'jetpack-mu-wpcom' ),
									readMoreLabel ? readMoreLabel : __( 'Keep reading', 'jetpack-mu-wpcom' )
								)
							}
							checked={ showReadMore }
							onChange={ () => setAttributes( { showReadMore: ! showReadMore } ) }
						/>
					) }
					{ ! showFullContent && showReadMore && (
						<TextControl
							label={
								sprintf(
									// translators: %s is the read more label'.
									__( '"%s" link text', 'jetpack-mu-wpcom' ),
									readMoreLabel ? readMoreLabel : __( 'Keep reading', 'jetpack-mu-wpcom' )
								)
							}
							hideLabelFromVision={ true }
							value={ readMoreLabel }
							placeholder={ readMoreLabel }
							onChange={ ( value: string ) => setAttributes( { readMoreLabel: value } ) }
							__next40pxDefaultSize
						/>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Featured Image', 'jetpack-mu-wpcom' ) } className="newspack-block__panel">
					<ToggleControl
						label={ __( 'Show featured image', 'jetpack-mu-wpcom' ) }
						checked={ showImage }
						onChange={ () => setAttributes( { showImage: ! showImage } ) }
					/>
					<ToggleControl
						label={ __( 'Show caption', 'jetpack-mu-wpcom' ) }
						checked={ showCaption }
						onChange={ () => setAttributes( { showCaption: ! showCaption } ) }
						disabled={ ! showImage }
					/>
					<ToggleControl
						label={ __( 'Show credit', 'jetpack-mu-wpcom' ) }
						checked={ showCredit }
						onChange={ () => setAttributes( { showCredit: ! showCredit } ) }
						disabled={ ! showImage }
					/>
					{ showImage && mediaPosition !== 'top' && mediaPosition !== 'behind' && (
						<>
							<ToggleControl
								label={ __( 'Stack on mobile', 'jetpack-mu-wpcom' ) }
								checked={ mobileStack }
								onChange={ () => setAttributes( { mobileStack: ! mobileStack } ) }
							/>
							<BaseControl
								label={ __( 'Size', 'jetpack-mu-wpcom' ) }
								id="newspack-block__featured-image-size"
								className="newspack-block__button-group"
							>
								<ButtonGroup>
									{ imageSizeOptions.map( option => {
										const isCurrent = imageScale === option.value;
										return (
											<Button
												variant={ isCurrent && 'primary' }
												aria-pressed={ isCurrent }
												aria-label={ option.label }
												key={ option.value }
												onClick={ () => setAttributes( { imageScale: option.value } ) }
											>
												{ option.shortName }
											</Button>
										);
									} ) }
								</ButtonGroup>
							</BaseControl>
						</>
					) }
					{ showImage && mediaPosition === 'behind' && (
						<RangeControl
							label={ __( 'Minimum height', 'jetpack-mu-wpcom' ) }
							help={ __(
								"Sets a minimum height for the block, using a percentage of the screen's current height.",
								'jetpack-mu-wpcom'
							) }
							value={ minHeight }
							onChange={ ( _minHeight: number ) => setAttributes( { minHeight: _minHeight } ) }
							min={ 0 }
							max={ 100 }
							required
							__next40pxDefaultSize
						/>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Post Meta', 'jetpack-mu-wpcom' ) }>
					<ToggleControl
						label={ __( 'Show category', 'jetpack-mu-wpcom' ) }
						checked={ showCategory }
						onChange={ () => setAttributes( { showCategory: ! showCategory } ) }
					/>
					{ IS_SUBTITLE_SUPPORTED_IN_THEME && (
						<ToggleControl
							label={ __( 'Show subtitle', 'jetpack-mu-wpcom' ) }
							checked={ showSubtitle }
							onChange={ () => setAttributes( { showSubtitle: ! showSubtitle } ) }
						/>
					) }
					<ToggleControl
						label={ __( 'Show author', 'jetpack-mu-wpcom' ) }
						checked={ showAuthor }
						onChange={ () => setAttributes( { showAuthor: ! showAuthor } ) }
					/>
					<ToggleControl
						label={ __( 'Show avatar', 'jetpack-mu-wpcom' ) }
						checked={ showAvatar }
						onChange={ () => setAttributes( { showAvatar: ! showAvatar } ) }
						disabled={ ! showAuthor }
					/>
					<ToggleControl
						label={ __( 'Show date', 'jetpack-mu-wpcom' ) }
						checked={ showDate }
						onChange={ () => setAttributes( { showDate: ! showDate } ) }
					/>
				</PanelBody>
				<PostTypesPanel attributes={ attributes } setAttributes={ setAttributes } />
				<PostStatusesPanel attributes={ attributes } setAttributes={ setAttributes } />
			</Fragment>
		);
	};

	renderStylesInspectorControls = () => {
		const { attributes, setAttributes, textColor, setTextColor } = this.props;

		const { colGap, postLayout, typeScale } = attributes;

		return (
			<Fragment>
				<PanelColorSettings
					title={ __( 'Color', 'jetpack-mu-wpcom' ) }
					colorSettings={ [
						{
							value: textColor.color,
							onChange: setTextColor,
							label: __( 'Text', 'jetpack-mu-wpcom' ),
						},
					] }
				/>
				<PanelBody
					title={ __( 'Typography', 'jetpack-mu-wpcom' ) }
					className="newpack-block__panel"
				>
					<RangeControl
						label={ __( 'Type Scale', 'jetpack-mu-wpcom' ) }
						beforeIcon={ typeScaleIcon }
						className="spacing-sizes-control"
						value={ typeScale }
						onChange={ ( _typeScale: number ) => setAttributes( { typeScale: _typeScale } ) }
						min={ 1 }
						max={ 10 }
						marks={ true }
						withInputField={ false }
						__nextHasNoMarginBottom={ true }
						required
					/>
				</PanelBody>
				{ postLayout === 'grid' && (
					<PanelBody title={ __( 'Dimensions', 'jetpack-mu-wpcom' ) }>
						<RangeControl
							label={ __( 'Grid Spacing', 'jetpack-mu-wpcom' ) }
							beforeIcon={ sidesAll }
							className="spacing-sizes-control"
							value={ colGap }
							onChange={ ( _colGap: number ) => setAttributes( { colGap: _colGap } ) }
							min={ 1 }
							max={ 3 }
							marks={ true }
							withInputField={ false }
							__nextHasNoMarginBottom={ true }
							required
						/>
					</PanelBody>
				) }
			</Fragment>
		);
	};

	componentDidMount() {
		this.props.triggerReflow();
	}
	componentDidUpdate( props: HomepageArticlesProps ) {
		if ( shouldReflow( props, this.props ) ) {
			this.props.triggerReflow();
		}
	}
	componentWillUnmount() {
		this.props.triggerReflow();
	}

	render() {
		/**
		 * Constants
		 */

		const { attributes, className, setAttributes, isSelected, latestPosts, textColor, error } =
			this.props;

		const {
			showImage,
			imageShape,
			postLayout,
			mediaPosition,
			moreButton,
			moreButtonText,
			columns,
			colGap,
			typeScale,
			imageScale,
			mobileStack,
			sectionHeader,
			showCaption,
			showCategory,
			specificMode,
			textAlign,
		} = attributes;

		const classes = classNames( className, {
			'is-grid': postLayout === 'grid',
			'show-image': showImage,
			[ `columns-${ columns }` ]: postLayout === 'grid',
			[ `colgap-${ colGap }` ]: postLayout === 'grid',
			[ `ts-${ typeScale }` ]: typeScale,
			[ `image-align${ mediaPosition }` ]: showImage,
			[ `is-${ imageScale }` ]: showImage,
			'mobile-stack': mobileStack,
			[ `is-${ imageShape }` ]: showImage,
			'has-text-color': textColor.color !== '',
			'show-caption': showCaption,
			'show-category': showCategory,
			[ `has-text-align-${ textAlign }` ]: textAlign,
			wpnbha: true,
		} );

		const blockControls = [
			{
				icon: list,
				title: __( 'List view', 'jetpack-mu-wpcom' ),
				onClick: () => setAttributes( { postLayout: 'list' } ),
				isActive: postLayout === 'list',
			},
			{
				icon: grid,
				title: __( 'Grid view', 'jetpack-mu-wpcom' ),
				onClick: () => setAttributes( { postLayout: 'grid' } ),
				isActive: postLayout === 'grid',
			},
		];

		const blockControlsImages = [
			{
				icon: postFeaturedImage,
				title: __( 'Show media on top', 'jetpack-mu-wpcom' ),
				isActive: mediaPosition === 'top',
				onClick: () => setAttributes( { mediaPosition: 'top' } ),
			},
			{
				icon: pullLeft,
				title: __( 'Show media on left', 'jetpack-mu-wpcom' ),
				isActive: mediaPosition === 'left',
				onClick: () => setAttributes( { mediaPosition: 'left' } ),
			},
			{
				icon: pullRight,
				title: __( 'Show media on right', 'jetpack-mu-wpcom' ),
				isActive: mediaPosition === 'right',
				onClick: () => setAttributes( { mediaPosition: 'right' } ),
			},
			{
				icon: image,
				title: __( 'Show media behind', 'jetpack-mu-wpcom' ),
				isActive: mediaPosition === 'behind',
				onClick: () => setAttributes( { mediaPosition: 'behind' } ),
			},
		];

		const blockControlsImageShape = [
			{
				icon: landscapeIcon,
				title: __( 'Landscape image shape', 'jetpack-mu-wpcom' ),
				isActive: imageShape === 'landscape',
				onClick: () => setAttributes( { imageShape: 'landscape' } ),
			},
			{
				icon: portraitIcon,
				title: __( 'portrait image shape', 'jetpack-mu-wpcom' ),
				isActive: imageShape === 'portrait',
				onClick: () => setAttributes( { imageShape: 'portrait' } ),
			},
			{
				icon: squareIcon,
				title: __( 'Square image shape', 'jetpack-mu-wpcom' ),
				isActive: imageShape === 'square',
				onClick: () => setAttributes( { imageShape: 'square' } ),
			},
			{
				icon: fullscreen,
				title: __( 'Uncropped', 'jetpack-mu-wpcom' ),
				isActive: imageShape === 'uncropped',
				onClick: () => setAttributes( { imageShape: 'uncropped' } ),
			},
		];

		return (
			<Fragment>
				<div
					className={ classes }
					style={ {
						color: textColor.color,
					} }
				>
					<div>
						{ latestPosts && ( ! RichText.isEmpty( sectionHeader ) || isSelected ) && (
							<RichText
								onChange={ ( value: string ) => setAttributes( { sectionHeader: value } ) }
								placeholder={ __( 'Write header…', 'jetpack-mu-wpcom' ) }
								value={ sectionHeader }
								tagName="h2"
								className="article-section-title"
							/>
						) }
						{ latestPosts && ! latestPosts.length && (
							<Placeholder>{ __( 'Sorry, no posts were found.', 'jetpack-mu-wpcom' ) }</Placeholder>
						) }
						{ ! latestPosts && ! error && (
							<Placeholder icon={ <Spinner /> } className="component-placeholder__align-center" />
						) }
						{ ! latestPosts && error && (
							<Placeholder className="component-placeholder__align-center newspack-block--error">
								{ error }
							</Placeholder>
						) }

						{ latestPosts && latestPosts.map( post => this.renderPost( post ) ) }
					</div>
				</div>

				{ ! specificMode && latestPosts && moreButton && ! isBlogPrivate() && (
					/*
					 * The "More" button option is hidden for private sites, so we should
					 * also hide the button in case it was previously enabled.
					 */
					<div className="editor-styles-wrapper wpnbha__wp-block-button__wrapper">
						<div className="wp-block-button">
							<RichText
								placeholder={ __( 'Load more posts', 'jetpack-mu-wpcom' ) }
								value={ moreButtonText }
								onChange={ ( value: string ) => setAttributes( { moreButtonText: value } ) }
								className="wp-block-button__link"
								allowedFormats={ [] }
							/>
						</div>
					</div>
				) }

				<BlockControls>
					<Toolbar>
						<AlignmentControl
							value={ textAlign }
							onChange={ ( nextAlign: string ) => {
								setAttributes( { textAlign: nextAlign } );
							} }
						/>
					</Toolbar>
					<Toolbar controls={ blockControls } />
					{ showImage && <Toolbar controls={ blockControlsImages } /> }
					{ showImage && <Toolbar controls={ blockControlsImageShape } /> }
				</BlockControls>
				<InspectorControls>{ this.renderInspectorControls() }</InspectorControls>
				<InspectorControls group="styles">{ this.renderStylesInspectorControls() }</InspectorControls>
			</Fragment>
		);
	}
}

export default compose( [
	withColors( { textColor: 'color' } ),
	withSelect( postsBlockSelector ),
	withDispatch( postsBlockDispatch ),
] as any )( Edit );
