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

class SearchResultMinimal extends Component {
	componentDidMount() {
		recordTrainTracksRender( this.getCommonTrainTracksProps() );
	}

	getCommonTrainTracksProps() {
		return {
			fetch_algo: 'jetpack-instant-search-api/v1',
			fetch_position: this.props.index,
			fetch_query: this.props.query,
			railcar: this.props.railcarId,
			rec_blog_id: this.props.result.fields.blog_id,
			rec_post_id: this.props.result.fields.post_id,
			ui_algo: 'jetpack-instant-search-ui/v1',
			ui_position: this.props.index,
		};
	}

	onClick = event => {
		// User-triggered event
		if ( event.isTrusted ) {
			event.stopPropagation();
			event.preventDefault();
			// Send out analytics call
			recordTrainTracksInteract( this.getCommonTrainTracksProps() );
			// Await next animation frame to ensure w.js processes the queue
			requestAnimationFrame( () => {
				// Re-dispatch click event
				const clonedEvent = new event.constructor( event.type, event );
				event.target.dispatchEvent( clonedEvent );
			} );
		} else {
			// Programmatically dispatched event from `dispatchEvent`
			return true;
		}
	};

	render() {
		const { result_type, fields, highlight } = this.props.result;
		const { locale = 'en-US' } = this.props;
		const IconSize = 18;
		if ( result_type !== 'post' ) {
			return null;
		}
		const url = new URL( 'http://' + fields[ 'permalink.url.raw' ] );
		const path = url.pathname;
		const no_content = ! highlight.content || highlight.content[ 0 ] === '';

		let tags = fields[ 'tag.name.default' ];
		if ( ! tags ) {
			tags = [];
		}
		if ( ! Array.isArray( tags ) ) {
			tags = [ tags ];
		}

		let cats = fields[ 'category.name.default' ];
		if ( ! cats ) {
			cats = [];
		}
		if ( ! Array.isArray( cats ) ) {
			cats = [ cats ];
		}
		const noTags = tags.length === 0 && cats.length === 0;

		const hasVideo = this.arrayOverlap( fields.shortcode_types, ShortcodeTypes.video );
		const hasAudio = this.arrayOverlap( fields.shortcode_types, ShortcodeTypes.audio );
		const hasGallery = this.arrayOverlap( fields.shortcode_types, ShortcodeTypes.gallery );

		let postTypeIcon = null;
		switch ( fields.post_type ) {
			case 'product':
				postTypeIcon = <Gridicon icon="cart" size={ IconSize } />;
				break;
			case 'page':
				if ( hasVideo ) {
					postTypeIcon = <Gridicon icon="video" size={ IconSize } />;
				} else if ( hasAudio ) {
					postTypeIcon = <Gridicon icon="audio" size={ IconSize } />;
				} else {
					postTypeIcon = <Gridicon icon="pages" size={ IconSize } />;
				}
				break;
			case 'video':
				postTypeIcon = <Gridicon icon="video" size={ IconSize } />;
				break;
			case 'gallery':
				postTypeIcon = <Gridicon icon="image-multiple" size={ IconSize } />;
				break;
			case 'event':
			case 'events':
				postTypeIcon = <Gridicon icon="calendar" size={ IconSize } />;
				break;
			default:
				if ( hasVideo ) {
					postTypeIcon = <Gridicon icon="video" size={ IconSize } />;
				} else if ( hasAudio ) {
					postTypeIcon = <Gridicon icon="audio" size={ IconSize } />;
				} else if ( hasGallery ) {
					postTypeIcon = <Gridicon icon="image-multiple" size={ IconSize } />;
				}
		}

		return (
			<div className="jetpack-instant-search__result-minimal">
				<span className="jetpack-instant-search__result-minimal-date">
					{ new Date( fields.date.split( ' ' )[ 0 ] ).toLocaleDateString( locale, {
						dateStyle: 'short',
					} ) }
				</span>
				<h3>
					{ postTypeIcon }
					<a
						href={ `//${ fields[ 'permalink.url.raw' ] }` }
						className="jetpack-instant-search__result-minimal-title"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ { __html: highlight.title } }
						onClick={ this.onClick }
					/>
				</h3>

				{ no_content && (
					<div className="jetpack-instant-search__result-minimal-content">
						{ noTags && (
							<div className="jetpack-instant-search__result-minimal-path">{ path }</div>
						) }
						{ tags.length !== 0 && (
							<div className="jetpack-instant-search__result-minimal-tag">
								{ tags.map( tag => (
									<span>
										<Gridicon icon="tag" size={ IconSize } />
										{ tag }
									</span>
								) ) }
							</div>
						) }
						{ cats.length !== 0 && (
							<div className="jetpack-instant-search__result-minimal-cat">
								{ cats.map( cat => (
									<span>
										<Gridicon icon="folder" size={ IconSize } />
										{ cat }
									</span>
								) ) }
							</div>
						) }
					</div>
				) }
				{ ! no_content && (
					<div
						className="jetpack-instant-search__result-minimal-content"
						//eslint-disable-next-line react/no-danger
						dangerouslySetInnerHTML={ {
							__html: highlight.content.join( ' ... ' ),
						} }
					/>
				) }

				{ highlight.comments && (
					<div className="jetpack-instant-search__result-minimal-comment">
						<Gridicon icon="comment" size={ IconSize } />
						<span
							className="jetpack-instant-search__result-minimal-comment-span"
							//eslint-disable-next-line react/no-danger
							dangerouslySetInnerHTML={ {
								__html: highlight.comments.join( ' ... ' ),
							} }
						/>
					</div>
				) }
			</div>
		);
	}
}

export default SearchResultMinimal;
