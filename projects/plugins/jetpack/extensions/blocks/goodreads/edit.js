import { BlockControls, BlockIcon, InspectorControls } from '@wordpress/block-editor';
import {
	Placeholder,
	SandBox,
	Button,
	Spinner,
	withNotices,
	TextControl,
	ToolbarButton,
	ToggleControl,
	PanelBody,
	SelectControl,
} from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import BlockStylesSelector from '../../shared/components/block-styles-selector';
import testEmbedUrl from '../../shared/test-embed-url';
import defaultExample from './default-example.png';
import gridExample from './grid-example.png';
import icon from './icon';

export class GoodreadsEdit extends Component {
	state = {
		userInput: '',
		displayPreview: false,
		isResolvingUrl: false,
	};

	componentDidMount() {
		this.setUrl( this.props.attributes.userInput );
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.attributes.widgetId === prevProps.attributes.widgetId ) {
			this.setRequestLink();
			this.props.setAttributes( { widgetId: Math.floor( Math.random() * 9999999 ) } );
		}
	}

	setUrl = userInput => {
		const { noticeOperations, setAttributes } = this.props;

		if ( ! userInput ) {
			return;
		}

		const widgetId = Math.floor( Math.random() * 9999999 );
		const regex = /\/(user|author)\/show\/(\d+)/;
		const goodreadsId = userInput.match( regex ) ? userInput.match( regex )[ 2 ] : false;

		if ( ! goodreadsId ) {
			this.setErrorNotice();
		} else {
			testEmbedUrl( userInput, this.setIsResolvingUrl )
				.then( response => {
					if ( response.endsWith( '/author' ) ) {
						setAttributes( { widgetId: undefined, userInput: undefined } );
						this.setErrorNotice();
						return;
					}

					setAttributes( { goodreadsId, widgetId, userInput } );
					this.setState( { displayPreview: true } );
					noticeOperations.removeAllNotices();
				} )
				.catch( () => {
					setAttributes( { widgetId: undefined, userInput: undefined } );
					this.setErrorNotice();
				} );
		}
	};

	setIsResolvingUrl = isResolvingUrl => this.setState( { isResolvingUrl } );

	setErrorNotice = () => {
		const { noticeOperations } = this.props;

		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(
			<>{ __( 'Sorry, this content could not be embedded.', 'jetpack' ) }</>
		);
	};

	setRequestLink = () => {
		const { attributes, setAttributes } = this.props;
		const {
			bookNumber,
			customTitle,
			goodreadsId,
			orderOption,
			shelfOption,
			showAuthor,
			showCover,
			showRating,
			showReview,
			showTags,
			showTitle,
			sortOption,
			widgetId,
		} = this.props.attributes;

		if ( ! goodreadsId ) {
			return;
		}

		let link = `https://www.goodreads.com/review/custom_widget/${ goodreadsId }.${ customTitle }?num_books=${ bookNumber }&order=${ orderOption }&shelf=${ shelfOption }&show_author=${
			showAuthor ? 1 : 0
		}&show_cover=${ showCover ? 1 : 0 }&show_rating=${ showRating ? 1 : 0 }&show_review=${
			showReview ? 1 : 0
		}&show_tags=${ showTags ? 1 : 0 }&show_title=${
			showTitle ? 1 : 0
		}&sort=${ sortOption }&widget_id=${ widgetId }`;
		let selector = 'gr_custom_widget_';

		if ( attributes.style === 'grid' ) {
			link = `https://www.goodreads.com/review/grid_widget/${ goodreadsId }.${ customTitle }?cover_size=medium&num_books=${ bookNumber }&order=${ orderOption }&shelf=${ shelfOption }&sort=${ sortOption }&widget_id=${ widgetId }`;
			selector = 'gr_grid_widget_';
		}

		setAttributes( { link, id: selector + widgetId } );
	};

	submitForm = event => {
		if ( event ) {
			event.preventDefault();
		}

		this.setUrl( this.state.userInput.trim() );
	};

	cannotEmbed = () => {
		const { url } = this.props.attributes;
		const { isResolvingUrl } = this.state;

		return ! isResolvingUrl && url;
	};

	renderLoading() {
		return (
			<div className="wp-block-embed is-loading">
				<Spinner />
				<p>{ __( 'Embedding…', 'jetpack' ) }</p>
			</div>
		);
	}

	renderDisplaySettings() {
		const { showCover, showAuthor, showTitle, showRating, showReview, showTags } =
			this.props.attributes;

		const { setAttributes } = this.props;

		return (
			<>
				<ToggleControl
					label={ __( 'Show cover', 'jetpack' ) }
					checked={ showCover }
					onChange={ () => setAttributes( { showCover: ! showCover } ) }
				/>

				<ToggleControl
					label={ __( 'Show author', 'jetpack' ) }
					checked={ showAuthor }
					onChange={ () => setAttributes( { showAuthor: ! showAuthor } ) }
				/>

				<ToggleControl
					label={ __( 'Show title', 'jetpack' ) }
					checked={ showTitle }
					onChange={ () => setAttributes( { showTitle: ! showTitle } ) }
				/>

				<ToggleControl
					label={ __( 'Show rating', 'jetpack' ) }
					checked={ showRating }
					onChange={ () => setAttributes( { showRating: ! showRating } ) }
				/>

				<ToggleControl
					label={ __( 'Show review', 'jetpack' ) }
					checked={ showReview }
					onChange={ () => setAttributes( { showReview: ! showReview } ) }
				/>

				<ToggleControl
					label={ __( 'Show tags', 'jetpack' ) }
					checked={ showTags }
					onChange={ () => setAttributes( { showTags: ! showTags } ) }
				/>
			</>
		);
	}

	renderInspectorControls() {
		const { style, shelfOption, bookNumber, orderOption, customTitle, sortOption } =
			this.props.attributes;
		const { attributes, clientId, setAttributes } = this.props;

		const embedTypes = [
			{
				value: 'default',
				label: __( 'Default', 'jetpack' ),
				preview: (
					<div className="block-editor-block-preview__container">
						<img
							src={ defaultExample }
							alt={ __( 'Example of Goodreads default block', 'jetpack' ) }
						/>
					</div>
				),
			},
			{
				value: 'grid',
				label: __( 'Grid', 'jetpack' ),
				preview: (
					<div className="block-editor-block-preview__container">
						<img
							src={ gridExample }
							alt={ __( 'Default example of Goodreads grid block', 'jetpack' ) }
						/>
					</div>
				),
			},
		];

		const shelfOptions = [
			{
				label: _x( 'Read', 'perfect participle - eg. I read a book yesterday.', 'jetpack' ),
				value: 'read',
			},
			{ label: __( 'Currently reading', 'jetpack' ), value: 'currently-reading' },
			{
				label: _x( 'To read', 'future participle - eg. I have this to read.', 'jetpack' ),
				value: 'to-read',
			},
		];

		const sortOptions = [
			{ label: 'ASIN', value: 'asin' },
			{ label: _x( 'Author', 'noun', 'jetpack' ), value: 'author' },
			{ label: __( 'Average rating', 'jetpack' ), value: 'avg_rating' },
			{ label: _x( 'Comments', 'noun', 'jetpack' ), value: 'comments' },
			{ label: _x( 'Cover', 'noun - ie. book cover', 'jetpack' ), value: 'cover' },
			{ label: __( 'Date added', 'jetpack' ), value: 'date_added' },
			{ label: __( 'Date published', 'jetpack' ), value: 'date_pub' },
			{ label: __( 'Date read', 'jetpack' ), value: 'date_read' },
			{ label: __( 'Date started', 'jetpack' ), value: 'date_started' },
			{ label: __( 'Dated updated', 'jetpack' ), value: 'date_updated' },
			{ label: _x( 'Format', 'noun', 'jetpack' ), value: 'format' },
			{ label: 'ISBN', value: 'isbn' },
			{ label: 'ISBN-13', value: 'isbn13' },
			{ label: _x( 'Notes', 'noun', 'jetpack' ), value: 'notes' },
			{ label: __( 'Number of pages', 'jetpack' ), value: 'num_pages' },
			{ label: __( 'Number of ratings', 'jetpack' ), value: 'num_ratings' },
			{ label: _x( 'Owned', 'possessive - eg. I owned it for a year', 'jetpack' ), value: 'owned' },
			{ label: _x( 'Position', 'noun', 'jetpack' ), value: 'position' },
			{ label: __( 'Random', 'jetpack', 'jetpack' ), value: 'random' },
			{ label: _x( 'Rating', 'noun', 'jetpack' ), value: 'rating' },
			{ label: __( 'Read count', 'jetpack' ), value: 'read_count' },
			{ label: _x( 'Review', 'noun', 'jetpack' ), value: 'review' },
			{ label: _x( 'Shelves', 'noun', 'jetpack' ), value: 'shelves' },
			{ label: _x( 'Title', 'noun', 'jetpack' ), value: 'title' },
			{ label: _x( 'Votes', 'noun', 'jetpack' ), value: 'votes' },
			{ label: __( 'Year published', 'jetpack' ), value: 'year_pub' },
		];

		const orderOptions = [
			{ label: 'Ascending', value: 'a' },
			{ label: 'Descending', value: 'd' },
		];

		return (
			<InspectorControls>
				<BlockStylesSelector
					title={ _x(
						'Embed Type',
						'option for how the embed displays on a page, e.g. inline or as a modal',
						'jetpack'
					) }
					clientId={ clientId }
					styleOptions={ embedTypes }
					onSelectStyle={ setAttributes }
					activeStyle={ style }
					attributes={ attributes }
					viewportWidth={ 130 }
				/>

				<PanelBody PanelBody title={ __( 'Goodreads Settings', 'jetpack' ) } initialOpen>
					<SelectControl
						label={ __( 'Shelf', 'jetpack' ) }
						value={ shelfOption }
						onChange={ value => setAttributes( { shelfOption: value } ) }
						options={ shelfOptions }
					/>

					<TextControl
						label={ __( 'Title', 'jetpack' ) }
						value={ customTitle || __( 'My Bookshelf', 'jetpack' ) }
						onChange={ value => setAttributes( { customTitle: value } ) }
					/>

					<SelectControl
						label={ __( 'Sort by', 'jetpack' ) }
						value={ sortOption }
						onChange={ value => setAttributes( { sortOption: value } ) }
						options={ sortOptions }
					/>

					<SelectControl
						label={ __( 'Order', 'jetpack' ) }
						value={ orderOption }
						onChange={ value => setAttributes( { orderOption: value } ) }
						options={ orderOptions }
					/>

					<TextControl
						label={ __( 'Number of books', 'jetpack' ) }
						type="number"
						inputMode="numeric"
						min="1"
						max={ style === 'grid' ? 200 : 100 }
						value={ bookNumber || 5 }
						onChange={ value => setAttributes( { bookNumber: value } ) }
					/>

					{ style === 'default' && this.renderDisplaySettings() }
				</PanelBody>
			</InspectorControls>
		);
	}

	renderEditEmbed() {
		const { className, noticeUI } = this.props;
		const { userInput } = this.state;

		return (
			<div className={ className }>
				<Placeholder
					label={ __( 'Goodreads', 'jetpack' ) }
					instructions={ __( 'Paste a link to a Goodreads profile.', 'jetpack' ) }
					icon={ <BlockIcon icon={ icon } /> }
					notices={ noticeUI }
				>
					<form onSubmit={ this.submitForm }>
						<input
							type="url"
							value={ userInput }
							className="components-placeholder__input"
							aria-label={ __( 'Goodreads profile URL', 'jetpack' ) }
							placeholder={ __( 'Enter a Goodreads profile URL to embed here…', 'jetpack' ) }
							onChange={ event => this.setState( { userInput: event.target.value } ) }
						/>
						<Button variant="secondary" type="submit">
							{ _x( 'Embed', 'submit button label', 'jetpack' ) }
						</Button>
					</form>
				</Placeholder>
			</div>
		);
	}

	renderBlockControls() {
		return (
			<BlockControls>
				<ToolbarButton
					className="components-toolbar__control"
					label={ __( 'Edit URL', 'jetpack' ) }
					icon="edit"
					onClick={ () => this.setState( { displayPreview: false } ) }
				/>
			</BlockControls>
		);
	}

	renderInlinePreview() {
		const { className } = this.props;
		const { goodreadsId, link, id } = this.props.attributes;

		if ( ! goodreadsId ) {
			return;
		}

		const html = `
		<style> [class^=gr_custom_container_] { border: 1px solid gray; border-radius: 10px; margin: auto; padding: 0 5px 10px 5px; background-color: #FFF; color: #000; width: 300px; }  [class^=gr_custom_header_] { border-bottom: 1px solid gray; width: 100%; padding: 10px 0; margin: auto; text-align: center; font-size: 120%; }  [class^=gr_custom_each_container_] { width: 100%; clear: both; margin: auto; overflow: auto; padding-bottom: 4px; border-bottom: 1px solid #aaa; }  [class^=gr_custom_each_container_] { width: 100%; clear: both; margin-bottom: 10px; overflow: auto; padding-bottom: 4px; border-bottom: 1px solid #aaa; }  [class^=gr_custom_book_container_] { overflow: hidden; height: 60px; float: left; margin-right: 6px; width: 39px; }  [class^=gr_custom_author_] { font-size: 10px; }  [class^=gr_custom_tags_] { font-size: 10px; color: gray; }  [class^=gr_custom_rating_] { float: right; }  [class^=gr_grid_book_container] { float: left; width: 98px; height: 160px; padding: 0px 0px; overflow: hidden; }  a { text-decoration: none; }  a:hover { text-decoration: underline; } img { max-width: 100%; }</style>
			<script src="${ link }"></script>
			<div id="${ id }"></div>
		`;

		return (
			<div className={ className }>
				<SandBox html={ html } />
				<div className="block-library-embed__interactive-overlay" />
			</div>
		);
	}

	render() {
		const { displayPreview, isResolvingUrl } = this.state;
		const isExampleBlock = this.props.attributes.goodreadsId === 1176283;

		if ( isResolvingUrl ) {
			return this.renderLoading();
		}

		if ( ( displayPreview && ! this.cannotEmbed() ) || isExampleBlock ) {
			return (
				<>
					{ this.renderInspectorControls() }
					{ this.renderBlockControls() }
					{ this.renderInlinePreview() }
				</>
			);
		}

		return this.renderEditEmbed();
	}
}

export default withNotices( GoodreadsEdit );
