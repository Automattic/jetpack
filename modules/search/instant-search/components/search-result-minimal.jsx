/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import PathBreadcrumbs from './path-breadcrumbs';
import PostTypeIcon from './post-type-icon';
import SearchResultComments from './search-result-comments';
import './search-result-minimal.scss';

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
		const tags = this.getTags();
		const cats = this.getCategories();
		const noTags = tags.length === 0 && cats.length === 0;
		return (
			<div className="jetpack-instant-search__search-result-minimal-content">
				{ noTags && <PathBreadcrumbs url={ this.props.result.fields[ 'permalink.url.raw' ] } /> }
				{ tags.length !== 0 && (
					<div className="jetpack-instant-search__search-result-minimal-tags">
						{ tags.map( tag => (
							<span className="jetpack-instant-search__search-result-minimal-tag">
								<Gridicon icon="tag" size={ this.getIconSize() } />
								{ tag }
							</span>
						) ) }
					</div>
				) }
				{ cats.length !== 0 && (
					<div className="jetpack-instant-search__search-result-minimal-cats">
						{ cats.map( cat => (
							<span className="jetpack-instant-search__search-result-minimal-cat">
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
				className="jetpack-instant-search__search-result-minimal-content"
				//eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={ {
					__html: this.props.result.highlight.content.join( ' ... ' ),
				} }
			/>
		);
	}

	render() {
		const { result_type, fields, highlight } = this.props.result;
		if ( result_type !== 'post' ) {
			return null;
		}
		const noMatchingContent = ! highlight.content || highlight.content[ 0 ] === '';

		return (
			<li className="jetpack-instant-search__search-result-minimal">
				<h3 className="jetpack-instant-search__search-result-title">
					<PostTypeIcon postType={ fields.post_type } shortcodeTypes={ fields.shortcode_types } />
					<a
						className="jetpack-instant-search__search-result-minimal-title"
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						onClick={ this.props.onClick }
						rel="noopener noreferrer"
						target="_blank"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: highlight.title } }
					/>
				</h3>
				{ noMatchingContent ? this.renderNoMatchingContent() : this.renderMatchingContent() }
				<SearchResultComments comments={ highlight && highlight.comments } />
			</li>
		);
	}
}

export default SearchResultMinimal;
