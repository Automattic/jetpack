import { memo } from '@wordpress/element';
import clsx from 'clsx';
import { default as linkIcon } from '../icons/link';

const Header = memo(
	( {
		playerId,
		title,
		cover,
		link,
		track,
		children,
		showEpisodeTitle,
		showCoverArt,
		showEpisodeDescription,
		colors,
	} ) =>
		showCoverArt || showEpisodeTitle || showEpisodeDescription ? (
			<div className="jetpack-podcast-player__header">
				<div className="jetpack-podcast-player__current-track-info">
					{ showCoverArt && cover && (
						<div className="jetpack-podcast-player__cover">
							{ /*
							 * alt="" will prevent the src from being announced by a screen reader.
							 * Ideally we'd have a cover.alt, but we can't get that from the RSS.
							 */ }
							<img className="jetpack-podcast-player__cover-image" src={ cover } alt="" />
						</div>
					) }

					{ showEpisodeTitle && !! ( title || ( track && track.title ) ) && (
						<Title
							playerId={ playerId }
							title={ title }
							link={ link }
							track={ track }
							colors={ colors }
						/>
					) }
				</div>

				{ /*
				 * Putting this above the audio player for source order HTML with screen
				 * readers, then visually switching it with the audio player via flex.
				 */ }
				{ !! ( showEpisodeDescription && track && track.description ) && (
					<p
						id={ `${ playerId }__track-description` }
						className="jetpack-podcast-player__track-description"
					>
						{ track.description }
					</p>
				) }

				{ /* children contains the audio player */ }
				{ children }
			</div>
		) : (
			children
		)
);

const Title = memo(
	( {
		playerId,
		title,
		link,
		track,
		colors = { primary: { name: null, custom: null, classes: '' } },
	} ) => (
		<h2 id={ `${ playerId }__title` } className="jetpack-podcast-player__title">
			{ !! ( track && track.title ) && (
				<span
					className={ clsx(
						'jetpack-podcast-player__current-track-title',
						colors.primary.classes
					) }
					style={ { color: colors.primary.custom } }
				>
					{ track.title }
					<a
						className="jetpack-podcast-player__track-title-link"
						href={ track.link || track.src }
						target="_blank"
						rel="noopener noreferrer nofollow"
					>
						{ linkIcon }
					</a>
				</span>
			) }

			{ /*
			 * Adds a visually hidden dash when both a track and a podcast titles are
			 * present.
			 */ }
			{ !! ( track && track.title && title ) && (
				<span className="jetpack-podcast-player--visually-hidden"> - </span>
			) }

			{ !! title && <PodcastTitle title={ title } link={ link } colors={ colors } /> }
		</h2>
	)
);

const PodcastTitle = memo( ( { title, link } ) => (
	<span className="jetpack-podcast-player__podcast-title">
		{ link ? (
			<a
				className="jetpack-podcast-player__link"
				href={ link }
				target="_blank"
				rel="noopener noreferrer nofollow"
			>
				{ title }
			</a>
		) : (
			{ title }
		) }
	</span>
) );

export default Header;
