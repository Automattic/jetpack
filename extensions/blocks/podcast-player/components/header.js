/**
 * External dependencies
 */
import { memo } from '@wordpress/element';

const Header = memo(
	( { playerId, title, cover, link, track, children, showCoverArt, showEpisodeDescription } ) => (
		<div className="jetpack-podcast-player__header-wrapper">
			<div className="jetpack-podcast-player__header" aria-live="polite">
				{ showCoverArt && cover ? (
					<div className="jetpack-podcast-player__track-image-wrapper">
						{ /* alt="" will prevent the src from being announced. Ideally we'd have a cover.alt, but we can't get that from the RSS */ }
						<img className="jetpack-podcast-player__track-image" src={ cover } alt="" />
					</div>
				) : null }

				{ title || ( track && track.title ) ? (
					<div className="jetpack-podcast-player__titles">
						<Title playerId={ playerId } title={ title } link={ link } track={ track } />
					</div>
				) : null }
			</div>

			{ /* putting this above the audio player for source order HTML with screen readers, then visually switching it with the audio player via flex */ }
			{ showEpisodeDescription && track && track.description ? (
				<div
					id={ `${ playerId }__track-description` }
					className="jetpack-podcast-player__track-description"
				>
					{ track.description }
				</div>
			) : null }

			{ /* children contains the audio player */ }
			{ children }
		</div>
	)
);

const Title = memo( ( { playerId, title, link, track } ) => (
	<h2 id={ `${ playerId }__title` } className="jetpack-podcast-player__titles">
		{ track && track.title ? (
			<span className="jetpack-podcast-player__track-title">{ track.title }</span>
		) : null }

		{ /* Adds a visually hidden dash when both a track and a podcast titles are present */ }
		{ track && track.title && title ? (
			<span className="jetpack-podcast-player--visually-hidden"> - </span>
		) : null }

		{ title ? <PodcastTitle title={ title } link={ link } /> : null }
	</h2>
) );

const PodcastTitle = memo( ( { title, link } ) => (
	<span className="jetpack-podcast-player__title">
		{ link ? (
			<a className="jetpack-podcast-player__title-link" href={ link }>
				{ title }
			</a>
		) : (
			title
		) }
	</span>
) );

export default Header;
