import { cleanForSlug } from '@wordpress/url';
import React, { Component } from 'react';
import Gridicon from './gridicon';
import PathBreadcrumbs from './path-breadcrumbs';
import PostTypeIcon from './post-type-icon';
import SearchResultComments from './search-result-comments';
import './search-result-minimal.scss';

const MAX_TAGS_OR_CATEGORIES = 5;

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

		return tags.slice( 0, MAX_TAGS_OR_CATEGORIES );
	}

	getCategories( returnAll = false ) {
		let cats = this.props.result.fields[ 'category.name.default' ];

		if ( ! cats ) {
			return [];
		}

		if ( ! Array.isArray( cats ) ) {
			cats = [ cats ];
		}

		if ( returnAll ) {
			return cats;
		}

		return cats.slice( 0, MAX_TAGS_OR_CATEGORIES );
	}

	renderNoMatchingContent() {
		const tags = this.getTags();
		const cats = this.getCategories();
		const noTags = tags.length === 0 && cats.length === 0;
		return (
			<div className="jetpack-instant-search__search-result-minimal-content">
				{ noTags && <PathBreadcrumbs url={ this.props.result.fields[ 'permalink.url.raw' ] } /> }
				<div className="jetpack-instant-search__search-result-minimal-cats-and-tags">
					{ tags.length !== 0 && (
						<ul className="jetpack-instant-search__search-result-minimal-tags">
							{ tags.map( tag => (
								<li className="jetpack-instant-search__search-result-minimal-tag">
									<Gridicon icon="tag" size={ this.getIconSize() } />
									<span className="jetpack-instant-search__search-result-minimal-tag-text">
										{ tag }
									</span>
								</li>
							) ) }
						</ul>
					) }
					{ cats.length !== 0 && (
						<ul className="jetpack-instant-search__search-result-minimal-cats">
							{ cats.map( cat => (
								<li className="jetpack-instant-search__search-result-minimal-cat">
									<Gridicon icon="folder" size={ this.getIconSize() } />
									<span className="jetpack-instant-search__search-result-minimal-cat-text">
										{ cat }
									</span>
								</li>
							) ) }
						</ul>
					) }
				</div>
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
			<li
				className={ [
					'jetpack-instant-search__search-result',
					'jetpack-instant-search__search-result-minimal',
					this.getCategories( true )
						.map( cat => 'jetpack-instant-search__search-result-category--' + cleanForSlug( cat ) )
						.join( ' ' ),
				].join( ' ' ) }
			>
				<h3 className="jetpack-instant-search__search-result-title jetpack-instant-search__search-result-minimal-title">
					<PostTypeIcon postType={ fields.post_type } shortcodeTypes={ fields.shortcode_types } />
					<a
						className="jetpack-instant-search__search-result-title-link jetpack-instant-search__search-result-minimal-title-link"
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						onClick={ this.props.onClick }
					>
						<span
							//eslint-disable-next-line react/no-danger
							dangerouslySetInnerHTML={ { __html: highlight.title } }
						/>
						{ fields[ 'forum.topic_resolved' ] === 'yes' && (
							<span className="jetpack-instant-search__search-result-title-checkmark" />
						) }
					</a>
				</h3>
				{ noMatchingContent ? this.renderNoMatchingContent() : this.renderMatchingContent() }
				<SearchResultComments comments={ highlight && highlight.comments } />
			</li>
		);
	}
}

export default SearchResultMinimal;
