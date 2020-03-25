/**
 * External dependencies
 */
import { memo } from '@wordpress/element';

const Header = memo( ( { playerId, title, cover, link, track, children } ) => (
	<div className="jetpack-podcast-player__header-wrapper">
		<div className="jetpack-podcast-player__header" aria-live="polite">
			{ cover ? (
				<div className="jetpack-podcast-player__track-image-wrapper">
					{ /* alt="" will prevent the src from being announced. Ideally we'd have a cover.alt, but we can't get that from the RSS */ }
					<img className="jetpack-podcast-player__track-image" src={ cover } alt="" />
				</div>
			) : null }

			<div className="jetpack-podcast-player__titles">
				{ /* The track title and player title are bundled together here in one <h3> so that it looks like "Track title - Podcast Title" for the aria-labelledby and screen reader headings */ }
				{ title || ( track && track.title ) ? (
					<h2 id={ `${ playerId }__title` } className="jetpack-podcast-player__titles">
						{ track && track.title ? (
							<span className="jetpack-podcast-player__track-title">{ track.title }</span>
						) : null }

						{ /* Adds a visually hidden - when both a track and title are present */ }
						{ track && track.title && title ? (
							<span className="jetpack-podcast-player--visually-hidden"> - </span>
						) : null }
						{ title && link ? (
							<span className="jetpack-podcast-player__title">
								<a className="jetpack-podcast-player__title-link" href={ link }>
									{ title }
								</a>
							</span>
						) : (
							<span className="jetpack-podcast-player__title">{ title }</span>
						) }
					</h2>
				) : null }
			</div>
		</div>

		{ /* putting this above the audio player for source order HTML with screen readers, then visually switching it with the audio player via flex */ }
		{ track && track.description ? (
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
) );

export default Header;
