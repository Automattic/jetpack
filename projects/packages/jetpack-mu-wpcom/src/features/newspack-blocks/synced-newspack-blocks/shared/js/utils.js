/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
import { RawHTML, Fragment } from '@wordpress/element';

export const formatAvatars = authorInfo =>
	authorInfo.map( author => (
		<span className="avatar author-avatar" key={ author.id }>
			<a className="url fn n" href={ author.author_link }>
				<RawHTML>{ author.avatar }</RawHTML>
			</a>
		</span>
	) );

export const formatByline = authorInfo => (
	<span className="byline">
		<span className="author-prefix">{ _x( 'by', 'post author', 'jetpack-mu-wpcom' ) }</span>{ ' ' }
		{ authorInfo.reduce( ( accumulator, author, index ) => {
			return [
				...accumulator,
				<span className="author vcard" key={ author.id }>
					<a className="url fn n" href={ author.author_link }>
						{ author.display_name }
					</a>
				</span>,
				index < authorInfo.length - 2 && ', ',
				authorInfo.length > 1 &&
					index === authorInfo.length - 2 &&
					_x( ' and ', 'post author', 'jetpack-mu-wpcom' ),
			];
		}, [] ) }
	</span>
);

export const formatSponsorLogos = sponsorInfo => (
	<span className="sponsor-logos">
		{ sponsorInfo.map( sponsor => (
			<Fragment key={ sponsor.id }>
				{ sponsor.src && (
					<a href={ sponsor.sponsor_url }>
						<img
							src={ sponsor.src }
							width={ sponsor.img_width }
							height={ sponsor.img_height }
							alt={ sponsor.sponsor_name }
						/>
					</a>
				) }
			</Fragment>
		) ) }
	</span>
);

export const formatSponsorByline = sponsorInfo => (
	<span className="byline sponsor-byline">
		{ sponsorInfo[ 0 ].byline_prefix }{ ' ' }
		{ sponsorInfo.reduce( ( accumulator, sponsor, index ) => {
			return [
				...accumulator,
				<span className="author" key={ sponsor.id }>
					<a href={ sponsor.author_link }>{ sponsor.sponsor_name }</a>
				</span>,
				index < sponsorInfo.length - 2 && ', ',
				sponsorInfo.length > 1 &&
					index === sponsorInfo.length - 2 &&
					_x( ' and ', 'post author', 'jetpack-mu-wpcom' ),
			];
		}, [] ) }
	</span>
);

export const getPostStatusLabel = ( post = {} ) =>
	post.post_status !== 'publish' ? (
		<div className="newspack-preview-label">
			{
				{ draft: __( 'Draft', 'jetpack-mu-wpcom' ), future: __( 'Scheduled', 'jetpack-mu-wpcom' ) }[
					post.post_status
				]
			}
		</div>
	) : null;
