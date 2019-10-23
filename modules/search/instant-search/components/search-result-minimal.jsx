/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import PostTypeIcon from './post-type-icon';
import SearchResultComments from './search-result-comments';

class SearchResultMinimal extends Component {
	getIconSize() {
		return 18;
	}

	getTags() {
		let tags = this.props.result.fields[ 'tag.name.default' ];
		if ( ! tags ) {
			return [];
		}
		if ( ! Array.isArray( tags ) ) {
			tags = [ tags ];
		}
		return tags;
	}

	getCategories() {
		let cats = this.props.result.fields[ 'category.name.default' ];
		if ( ! cats ) {
			return [];
		}
		if ( ! Array.isArray( cats ) ) {
			cats = [ cats ];
		}
		return cats;
	}

	renderNoMatchingContent() {
		const path = new URL( 'http://' + this.props.result.fields[ 'permalink.url.raw' ] ).pathname;
		const tags = this.getTags();
		const cats = this.getCategories();
		const noTags = tags.length === 0 && cats.length === 0;
		return (
			<div className="jetpack-instant-search__result-minimal-content">
				{ noTags && <div className="jetpack-instant-search__result-minimal-path">{ path }</div> }
				{ tags.length !== 0 && (
					<div className="jetpack-instant-search__result-minimal-tags">
						{ tags.map( tag => (
							<span className="jetpack-instant-search__result-minimal-tag">
								<Gridicon icon="tag" size={ this.getIconSize() } />
								{ tag }
							</span>
						) ) }
					</div>
				) }
				{ cats.length !== 0 && (
					<div className="jetpack-instant-search__result-minimal-cats">
						{ cats.map( cat => (
							<span className="jetpack-instant-search__result-minimal-cat">
								<Gridicon icon="folder" size={ this.getIconSize() } />
								{ cat }
							</span>
						) ) }
					</div>
				) }
			</div>
		);
	}

	renderMatchingContent() {
		return (
			<div
				className="jetpack-instant-search__result-minimal-content"
				//eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={ {
					__html: this.props.result.highlight.content.join( ' ... ' ),
				} }
			/>
		);
	}

	render() {
		const { locale = 'en-US' } = this.props;
		const { result_type, fields, highlight } = this.props.result;
		if ( result_type !== 'post' ) {
			return null;
		}
		const noMatchingContent = ! highlight.content || highlight.content[ 0 ] === '';
		return (
			<div className="jetpack-instant-search__result-minimal">
				<span className="jetpack-instant-search__result-minimal-date">
					{ new Date( fields.date.split( ' ' )[ 0 ] ).toLocaleDateString( locale, {
						dateStyle: 'short',
					} ) }
				</span>
				<h3>
					<PostTypeIcon
						postType={ fields.post_type }
						shortcodeTypes={ fields.shortcode_types }
						imageCount={ fields[ 'has.image' ] }
					/>
					<a
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						className="jetpack-instant-search__result-minimal-title"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: highlight.title } }
						onClick={ this.onClick }
					/>
				</h3>
				{ noMatchingContent ? this.renderNoMatchingContent() : this.renderMatchingContent() }
				<SearchResultComments comments={ highlight && highlight.comments } />
			</div>
		);
	}
}

export default SearchResultMinimal;
