/* eslint-disable jsx-a11y/anchor-is-valid */

/**
 * Internal dependencies
 */
import QueryControls from '../../components/query-controls';
import { STORE_NAMESPACE } from './store';
import {
	getEditorBlocksIds,
	isBlogPrivate,
	shouldReflow,
	queryCriteriaFromAttributes,
} from './utils';
import {
	formatAvatars,
	formatByline,
	formatSponsorLogos,
	formatSponsorByline,
} from '../../shared/js/utils';

/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { dateI18n, __experimentalGetSettings } from '@wordpress/date';
import { Component, Fragment, RawHTML } from '@wordpress/element';
import {
	BlockControls,
	InspectorControls,
	PanelColorSettings,
	RichText,
	withColors,
} from '@wordpress/block-editor';
import {
	Button,
	ButtonGroup,
	PanelBody,
	PanelRow,
	RangeControl,
	Toolbar,
	ToggleControl,
	Placeholder,
	Spinner,
	BaseControl,
	Path,
	SVG,
} from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

let IS_SUBTITLE_SUPPORTED_IN_THEME;
if (
	typeof window === 'object' &&
	window.newspackIsPostSubtitleSupported &&
	window.newspackIsPostSubtitleSupported.post_subtitle
) {
	IS_SUBTITLE_SUPPORTED_IN_THEME = true;
}

/* From https://material.io/tools/icons */
const landscapeIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M0 0h24v24H0z" fill="none" />
		<Path d="M19 5H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 12H5V7h14v10z" />
	</SVG>
);

const portraitIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M0 0h24v24H0z" fill="none" />
		<Path d="M17 3H7c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H7V5h10v14z" />
	</SVG>
);

const squareIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M0 0h24v24H0z" fill="none" />
		<Path d="M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H6V6h12v12z" />
	</SVG>
);

const uncroppedIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M0 0h24v24H0z" fill="none" />
		<Path d="M3 5v4h2V5h4V3H5c-1.1 0-2 .9-2 2zm2 10H3v4c0 1.1.9 2 2 2h4v-2H5v-4zm14 4h-4v2h4c1.1 0 2-.9 2-2v-4h-2v4zm0-16h-4v2h4v4h2V5c0-1.1-.9-2-2-2z" />
	</SVG>
);

const coverIcon = (
	<SVG xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
		<Path d="M0 0h24v24H0z" fill="none" />
		<Path d="M4 4h7V2H4c-1.1 0-2 .9-2 2v7h2V4zm6 9l-4 5h12l-3-4-2.03 2.71L10 13zm7-4.5c0-.83-.67-1.5-1.5-1.5S14 7.67 14 8.5s.67 1.5 1.5 1.5S17 9.33 17 8.5zM20 2h-7v2h7v7h2V4c0-1.1-.9-2-2-2zm0 18h-7v2h7c1.1 0 2-.9 2-2v-7h-2v7zM4 13H2v7c0 1.1.9 2 2 2h7v-2H4v-7z" />
	</SVG>
);

class Edit extends Component {
	renderPost = post => {
		const { attributes, isUIDisabled } = this.props;
		const {
			showImage,
			imageShape,
			mediaPosition,
			minHeight,
			showCaption,
			showExcerpt,
			showSubtitle,
			showAuthor,
			showAvatar,
			showDate,
			showCategory,
			sectionHeader,
		} = attributes;

		const styles = {
			minHeight:
				mediaPosition === 'behind' &&
				showImage &&
				post.newspack_featured_image_src &&
				minHeight + 'vh',
			paddingTop:
				mediaPosition === 'behind' &&
				showImage &&
				post.newspack_featured_image_src &&
				minHeight / 5 + 'vh',
		};

		const postClasses = classNames(
			{
				'post-has-image': post.newspack_featured_image_src,
				'homepage-posts-block__post--disabled': isUIDisabled,
			},
			post.newspack_article_classes
		);

		const postTitle = this.titleForPost( post );
		const dateFormat = __experimentalGetSettings().formats.date;

		return (
			<article className={ postClasses } key={ post.id } style={ styles }>
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
						{ showCaption && '' !== post.newspack_featured_image_caption && (
							<figcaption>{ post.newspack_featured_image_caption }</figcaption>
						) }
					</figure>
				) }

				<div className="entry-wrapper">
					{ post.newspack_post_sponsors && (
						<span className="cat-links sponsor-label">
							<span className="flag">{ post.newspack_post_sponsors[ 0 ].flag }</span>
						</span>
					) }
					{ showCategory && post.newspack_category_info.length && ! post.newspack_post_sponsors && (
						<div className="cat-links">
							<a href="#">{ decodeEntities( post.newspack_category_info ) }</a>
						</div>
					) }
					{ RichText.isEmpty( sectionHeader ) ? (
						<h2 className="entry-title" key="title">
							{ post.newspack_post_format === 'aside' ? postTitle : <a href="#">{ postTitle }</a> }
						</h2>
					) : (
						<h3 className="entry-title" key="title">
							{ post.newspack_post_format === 'aside' ? postTitle : <a href="#">{ postTitle }</a> }
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
					{ showExcerpt && (
						<RawHTML key="excerpt" className="excerpt-contain">
							{ post.newspack_post_format === 'aside'
								? post.content.rendered
								: post.excerpt.rendered }
						</RawHTML>
					) }
					<div className="entry-meta">
						{ post.newspack_post_sponsors && formatSponsorLogos( post.newspack_post_sponsors ) }
						{ post.newspack_post_sponsors && formatSponsorByline( post.newspack_post_sponsors ) }
						{ showAuthor &&
							showAvatar &&
							! post.newspack_post_sponsors &&
							formatAvatars( post.newspack_author_info ) }
						{ showAuthor &&
							! post.newspack_post_sponsors &&
							formatByline( post.newspack_author_info ) }
						{ showDate && (
							<time className="entry-date published" key="pub-date">
								{ dateI18n( dateFormat, post.date_gmt ) }
							</time>
						) }
					</div>
				</div>
			</article>
		);
	};

	titleForPost = post => {
		if ( ! post.title ) {
			return '';
		}
		if ( typeof post.title === 'string' ) {
			return decodeEntities( post.title.trim() );
		}
		if ( typeof post.title === 'object' && post.title.rendered ) {
			return decodeEntities( post.title.rendered.trim() );
		}
	};

	renderInspectorControls = () => {
		const { attributes, setAttributes, textColor, setTextColor } = this.props;

		const {
			authors,
			specificPosts,
			postsToShow,
			categories,
			columns,
			showImage,
			showCaption,
			imageScale,
			mobileStack,
			minHeight,
			moreButton,
			showExcerpt,
			showSubtitle,
			typeScale,
			showDate,
			showAuthor,
			showAvatar,
			showCategory,
			postLayout,
			mediaPosition,
			specificMode,
			tags,
			tagExclusions,
		} = attributes;

		const imageSizeOptions = [
			{
				value: 1,
				label: /* translators: label for small size option */ __( 'Small', 'jetpack' ),
				shortName: /* translators: abbreviation for small size */ __( 'S', 'jetpack' ),
			},
			{
				value: 2,
				label: /* translators: label for medium size option */ __( 'Medium', 'jetpack' ),
				shortName: /* translators: abbreviation for medium size */ __( 'M', 'jetpack' ),
			},
			{
				value: 3,
				label: /* translators: label for large size option */ __( 'Large', 'jetpack' ),
				shortName: /* translators: abbreviation for large size */ __( 'L', 'jetpack' ),
			},
			{
				value: 4,
				label: /* translators: label for extra large size option */ __( 'Extra Large', 'jetpack' ),
				shortName: /* translators: abbreviation for extra large size */ __( 'XL', 'jetpack' ),
			},
		];

		return (
			<Fragment>
				<PanelBody title={ __( 'Display Settings', 'jetpack' ) } initialOpen={ true }>
					<QueryControls
						numberOfItems={ postsToShow }
						onNumberOfItemsChange={ _postsToShow =>
							setAttributes( { postsToShow: _postsToShow || 1 } )
						}
						specificMode={ specificMode }
						onSpecificModeChange={ _specificMode =>
							setAttributes( { specificMode: _specificMode } )
						}
						specificPosts={ specificPosts }
						onSpecificPostsChange={ _specificPosts =>
							setAttributes( { specificPosts: _specificPosts } )
						}
						authors={ authors }
						onAuthorsChange={ _authors => setAttributes( { authors: _authors } ) }
						categories={ categories }
						onCategoriesChange={ _categories => setAttributes( { categories: _categories } ) }
						tags={ tags }
						onTagsChange={ _tags => {
							setAttributes( { tags: _tags } );
						} }
						tagExclusions={ tagExclusions }
						onTagExclusionsChange={ _tagExclusions =>
							setAttributes( { tagExclusions: _tagExclusions } )
						}
					/>
					{ postLayout === 'grid' && (
						<RangeControl
							label={ __( 'Columns', 'jetpack' ) }
							value={ columns }
							onChange={ _columns => setAttributes( { columns: _columns } ) }
							min={ 2 }
							max={ 6 }
							required
						/>
					) }
					{ ! specificMode && isBlogPrivate() ? (
						/*
						 * Hide the "Load more posts" button option on private sites.
						 *
						 * Client-side fetching from a private WP.com blog requires authentication,
						 * which is not provided in the current implementation.
						 * See https://github.com/Automattic/newspack-blocks/issues/306.
						 */
						<i>
							{ __(
								'This blog is private, therefore the "Load more posts" feature is not active.',
								'jetpack'
							) }
						</i>
					) : (
						<ToggleControl
							label={ __( 'Show "Load more posts" Button', 'jetpack' ) }
							checked={ moreButton }
							onChange={ () => setAttributes( { moreButton: ! moreButton } ) }
						/>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Featured Image Settings', 'jetpack' ) }>
					<PanelRow>
						<ToggleControl
							label={ __( 'Show Featured Image', 'jetpack' ) }
							checked={ showImage }
							onChange={ () => setAttributes( { showImage: ! showImage } ) }
						/>
					</PanelRow>

					{ showImage && (
						<PanelRow>
							<ToggleControl
								label={ __( 'Show Featured Image Caption', 'jetpack' ) }
								checked={ showCaption }
								onChange={ () => setAttributes( { showCaption: ! showCaption } ) }
							/>
						</PanelRow>
					) }

					{ showImage && mediaPosition !== 'top' && mediaPosition !== 'behind' && (
						<Fragment>
							<PanelRow>
								<ToggleControl
									label={ __( 'Stack on mobile', 'jetpack' ) }
									checked={ mobileStack }
									onChange={ () => setAttributes( { mobileStack: ! mobileStack } ) }
								/>
							</PanelRow>
							<BaseControl
								label={ __( 'Featured Image Size', 'jetpack' ) }
								id="newspackfeatured-image-size"
							>
								<PanelRow>
									<ButtonGroup
										id="newspackfeatured-image-size"
										aria-label={ __( 'Featured Image Size', 'jetpack' ) }
									>
										{ imageSizeOptions.map( option => {
											const isCurrent = imageScale === option.value;
											return (
												<Button
													isLarge
													isPrimary={ isCurrent }
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
								</PanelRow>
							</BaseControl>
						</Fragment>
					) }

					{ showImage && mediaPosition === 'behind' && (
						<RangeControl
							label={ __( 'Minimum height', 'jetpack' ) }
							help={ __(
								"Sets a minimum height for the block, using a percentage of the screen's current height.",
								'jetpack'
							) }
							value={ minHeight }
							onChange={ _minHeight => setAttributes( { minHeight: _minHeight } ) }
							min={ 0 }
							max={ 100 }
							required
						/>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Post Control Settings', 'jetpack' ) }>
					{ IS_SUBTITLE_SUPPORTED_IN_THEME && (
						<PanelRow>
							<ToggleControl
								label={ __( 'Show Subtitle', 'jetpack' ) }
								checked={ showSubtitle }
								onChange={ () => setAttributes( { showSubtitle: ! showSubtitle } ) }
							/>
						</PanelRow>
					) }
					<PanelRow>
						<ToggleControl
							label={ __( 'Show Excerpt', 'jetpack' ) }
							checked={ showExcerpt }
							onChange={ () => setAttributes( { showExcerpt: ! showExcerpt } ) }
						/>
					</PanelRow>
					<RangeControl
						className="type-scale-slider"
						label={ __( 'Type Scale', 'jetpack' ) }
						value={ typeScale }
						onChange={ _typeScale => setAttributes( { typeScale: _typeScale } ) }
						min={ 1 }
						max={ 10 }
						beforeIcon="editor-textcolor"
						afterIcon="editor-textcolor"
						required
					/>
				</PanelBody>
				<PanelColorSettings
					title={ __( 'Color Settings', 'jetpack' ) }
					initialOpen={ true }
					colorSettings={ [
						{
							value: textColor.color,
							onChange: setTextColor,
							label: __( 'Text Color', 'jetpack' ),
						},
					] }
				/>
				<PanelBody title={ __( 'Post Meta Settings', 'jetpack' ) }>
					<PanelRow>
						<ToggleControl
							label={ __( 'Show Date', 'jetpack' ) }
							checked={ showDate }
							onChange={ () => setAttributes( { showDate: ! showDate } ) }
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={ __( 'Show Category', 'jetpack' ) }
							checked={ showCategory }
							onChange={ () => setAttributes( { showCategory: ! showCategory } ) }
						/>
					</PanelRow>
					<PanelRow>
						<ToggleControl
							label={ __( 'Show Author', 'jetpack' ) }
							checked={ showAuthor }
							onChange={ () => setAttributes( { showAuthor: ! showAuthor } ) }
						/>
					</PanelRow>
					{ showAuthor && (
						<PanelRow>
							<ToggleControl
								label={ __( 'Show Author Avatar', 'jetpack' ) }
								checked={ showAvatar }
								onChange={ () => setAttributes( { showAvatar: ! showAvatar } ) }
							/>
						</PanelRow>
					) }
				</PanelBody>
			</Fragment>
		);
	};

	componentDidMount() {
		this.props.triggerReflow();
	}
	componentDidUpdate( props ) {
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

		const {
			attributes,
			className,
			setAttributes,
			isSelected,
			latestPosts,
			textColor,
			error,
		} = this.props;

		const {
			showImage,
			imageShape,
			postLayout,
			mediaPosition,
			moreButton,
			moreButtonText,
			columns,
			typeScale,
			imageScale,
			mobileStack,
			sectionHeader,
			showCaption,
			showCategory,
			specificMode,
		} = attributes;

		const classes = classNames( className, {
			'is-grid': postLayout === 'grid',
			'show-image': showImage,
			[ `columns-${ columns }` ]: postLayout === 'grid',
			[ `ts-${ typeScale }` ]: typeScale !== '5',
			[ `image-align${ mediaPosition }` ]: showImage,
			[ `is-${ imageScale }` ]: imageScale !== '1' && showImage,
			'mobile-stack': mobileStack,
			[ `is-${ imageShape }` ]: showImage,
			'has-text-color': textColor.color !== '',
			'show-caption': showCaption,
			'show-category': showCategory,
			wpnbha: true,
		} );

		const blockControls = [
			{
				icon: 'list-view',
				title: __( 'List View', 'jetpack' ),
				onClick: () => setAttributes( { postLayout: 'list' } ),
				isActive: postLayout === 'list',
			},
			{
				icon: 'grid-view',
				title: __( 'Grid View', 'jetpack' ),
				onClick: () => setAttributes( { postLayout: 'grid' } ),
				isActive: postLayout === 'grid',
			},
		];

		const blockControlsImages = [
			{
				icon: 'align-none',
				title: __( 'Show media on top', 'jetpack' ),
				isActive: mediaPosition === 'top',
				onClick: () => setAttributes( { mediaPosition: 'top' } ),
			},
			{
				icon: 'align-pull-left',
				title: __( 'Show media on left', 'jetpack' ),
				isActive: mediaPosition === 'left',
				onClick: () => setAttributes( { mediaPosition: 'left' } ),
			},
			{
				icon: 'align-pull-right',
				title: __( 'Show media on right', 'jetpack' ),
				isActive: mediaPosition === 'right',
				onClick: () => setAttributes( { mediaPosition: 'right' } ),
			},
			{
				icon: coverIcon,
				title: __( 'Show media behind', 'jetpack' ),
				isActive: mediaPosition === 'behind',
				onClick: () => setAttributes( { mediaPosition: 'behind' } ),
			},
		];

		const blockControlsImageShape = [
			{
				icon: landscapeIcon,
				title: __( 'Landscape Image Shape', 'jetpack' ),
				isActive: imageShape === 'landscape',
				onClick: () => setAttributes( { imageShape: 'landscape' } ),
			},
			{
				icon: portraitIcon,
				title: __( 'portrait Image Shape', 'jetpack' ),
				isActive: imageShape === 'portrait',
				onClick: () => setAttributes( { imageShape: 'portrait' } ),
			},
			{
				icon: squareIcon,
				title: __( 'Square Image Shape', 'jetpack' ),
				isActive: imageShape === 'square',
				onClick: () => setAttributes( { imageShape: 'square' } ),
			},
			{
				icon: uncroppedIcon,
				title: __( 'Uncropped', 'jetpack' ),
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
								onChange={ value => setAttributes( { sectionHeader: value } ) }
								placeholder={ __( 'Write header…', 'jetpack' ) }
								value={ sectionHeader }
								tagName="h2"
								className="article-section-title"
							/>
						) }
						{ latestPosts && ! latestPosts.length && (
							<Placeholder>{ __( 'Sorry, no posts were found.', 'jetpack' ) }</Placeholder>
						) }
						{ ! latestPosts && ! error && (
							<Placeholder icon={ <Spinner /> } className="component-placeholder__align-center" />
						) }
						{ ! latestPosts && error && (
							<Placeholder className="component-placeholder__align-center homepage-posts-block--error">
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
								placeholder={ __( 'Load more posts', 'jetpack' ) }
								value={ moreButtonText }
								onChange={ value => setAttributes( { moreButtonText: value } ) }
								className="wp-block-button__link"
								keepPlaceholderOnFocus
								allowedFormats={ [] }
							/>
						</div>
					</div>
				) }

				<BlockControls>
					<Toolbar controls={ blockControls } />
					{ showImage && <Toolbar controls={ blockControlsImages } /> }
					{ showImage && <Toolbar controls={ blockControlsImageShape } /> }
				</BlockControls>
				<InspectorControls>{ this.renderInspectorControls() }</InspectorControls>
			</Fragment>
		);
	}
}

export default compose( [
	withColors( { textColor: 'color' } ),
	withSelect( ( select, { clientId, attributes } ) => {
		const { getEditorBlocks, getBlocks } = select( 'core/editor' );
		const editorBlocksIds = getEditorBlocksIds( getEditorBlocks() );
		// The block might be rendered in the block styles preview, not in the editor.
		const isEditorBlock = editorBlocksIds.indexOf( clientId ) >= 0;

		const { getPosts, getError, isUIDisabled } = select( STORE_NAMESPACE );

		const props = {
			isEditorBlock,
			isUIDisabled: isUIDisabled(),
			error: getError( { clientId } ),
			topBlocksClientIdsInOrder: getBlocks().map( block => block.clientId ),
		};

		if ( isEditorBlock ) {
			props.latestPosts = getPosts( { clientId } );
		} else {
			// For block preview, display without deduplication. If there would be a way to match the outside-editor's
			// block clientId to the clientId of the block that's being previewed, the correct posts could be shown here.
			props.latestPosts = select( 'core' ).getEntityRecords(
				'postType',
				'post',
				queryCriteriaFromAttributes( attributes )
			);
		}

		return props;
	} ),
	withDispatch( ( dispatch, { isEditorBlock } ) => {
		return {
			// Only editor blocks can trigger reflows.
			triggerReflow: isEditorBlock ? dispatch( STORE_NAMESPACE ).reflow : () => {},
		};
	} ),
] )( Edit );
