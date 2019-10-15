/** @jsx h */

/**
 * External dependencies
 */
import { h, Component } from 'preact';

/**
 * Internal dependencies
 */
import Gridicon from './gridicon';
import arrayOverlap from '../lib/array-overlap';
import { recordTrainTracksRender, recordTrainTracksInteract } from '../lib/tracks';

const ShortcodeTypes = {
	video: [
		'youtube',
		'ooyala',
		'anvplayer',
		'wpvideo',
		'bc_video',
		'video',
		'brightcove',
		'tp_video',
		'jwplayer',
		'tempo-video',
		'vimeo',
	],
	gallery: [ 'gallery', 'ione_media_gallery' ],
	audio: [ 'audio', 'soundcloud' ],
};

const POST_TYPE_TO_ICON_MAP = {
	product: 'cart',
	video: 'video',
	gallery: 'image-multiple',
	event: 'calendar',
	events: 'calendar',
};

class SearchResultMinimal extends Component {
	componentDidMount() {
		recordTrainTracksRender( this.getCommonTrainTracksProps() );
	}

	getCommonTrainTracksProps() {
		return {
			fetch_algo: this.props.result.railcar.fetch_algo,
			fetch_position: this.props.result.railcar.fetch_position,
			fetch_query: this.props.result.railcar.fetch_query,
			railcar: this.props.result.railcar.railcar,
			rec_blog_id: this.props.result.railcar.rec_blog_id,
			rec_post_id: this.props.result.railcar.rec_post_id,
			ui_algo: 'jetpack-instant-search-ui/v1',
			ui_position: this.props.index,
		};
	}

	onClick = () => {
		// Send out analytics call
		recordTrainTracksInteract( { ...this.getCommonTrainTracksProps(), action: 'click' } );
	};

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

	renderPostTypeIcon() {
		const { fields } = this.props.result;
		const iconSize = this.getIconSize();
		const hasVideo = arrayOverlap( fields.shortcode_types, ShortcodeTypes.video );
		const hasAudio = arrayOverlap( fields.shortcode_types, ShortcodeTypes.audio );
		const hasGallery = arrayOverlap( fields.shortcode_types, ShortcodeTypes.gallery );

		if ( Object.keys( POST_TYPE_TO_ICON_MAP ).includes( fields.post_type ) ) {
			return POST_TYPE_TO_ICON_MAP[ fields.post_type ];
		}

		switch ( fields.post_type ) {
			case 'page':
				if ( hasVideo ) {
					return <Gridicon icon="video" size={ iconSize } />;
				} else if ( hasAudio ) {
					return <Gridicon icon="audio" size={ iconSize } />;
				}
				return <Gridicon icon="pages" size={ iconSize } />;
			default:
				if ( hasVideo ) {
					return <Gridicon icon="video" size={ iconSize } />;
				} else if ( hasAudio ) {
					return <Gridicon icon="audio" size={ iconSize } />;
				} else if ( hasGallery ) {
					return <Gridicon icon="image-multiple" size={ iconSize } />;
				}
		}
		return null;
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
					<div className="jetpack-instant-search__result-minimal-tag">
						{ tags.map( tag => (
							<span>
								<Gridicon icon="tag" size={ this.getIconSize() } />
								{ tag }
							</span>
						) ) }
					</div>
				) }
				{ cats.length !== 0 && (
					<div className="jetpack-instant-search__result-minimal-cat">
						{ cats.map( cat => (
							<span>
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

	renderComments() {
		return (
			this.props.result.highlight.comments && (
				<div className="jetpack-instant-search__result-minimal-comment">
					<Gridicon icon="comment" size={ this.getIconSize() } />
					<span
						className="jetpack-instant-search__result-minimal-comment-span"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ {
							__html: this.props.result.highlight.comments.join( ' ... ' ),
						} }
					/>
				</div>
			)
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
					{ this.renderPostTypeIcon() }
					<a
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						className="jetpack-instant-search__result-minimal-title"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: highlight.title } }
						onClick={ this.onClick }
					/>
				</h3>
				{ noMatchingContent ? this.renderNoMatchingContent() : this.renderMatchingContent() }
				{ this.renderComments() }
			</div>
		);
	}
}

export default SearchResultMinimal;
