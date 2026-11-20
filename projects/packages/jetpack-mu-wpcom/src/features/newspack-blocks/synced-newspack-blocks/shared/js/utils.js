/* eslint-disable jsx-a11y/anchor-is-valid */
/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

export const getBylineHTML = ( post, showAvatar = false ) => {
	const byline = '<span class="byline">' + post.newspack_post_byline + '</span>';
	if ( showAvatar && post.newspack_post_avatars ) {
		return post.newspack_post_avatars + byline;
	}
	return byline;
};

export const formatSponsorLogos = sponsorInfo => (
	<span className="sponsor-logos">
		{ sponsorInfo.map( sponsor => (
			<Fragment key={ sponsor.id }>
				{ sponsor.src && (
					// A live sponsor URL would navigate the editor-canvas iframe away from
					// the post being edited; the sponsor slot replaces the byline when
					// newspack_sponsors_show_author is off, so it needs the same inert
					// href="#" the other editor anchors use.
					<a href="#">
						<img src={ sponsor.src } width={ sponsor.img_width } height={ sponsor.img_height } alt={ sponsor.sponsor_name } />
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
					{ /* author_link is never populated in the editor payload; href="#" makes the inertness explicit. */ }
					<a href="#">{ sponsor.sponsor_name }</a>
				</span>,
				index < sponsorInfo.length - 2 && ', ',
				sponsorInfo.length > 1 && index === sponsorInfo.length - 2 && _x( 'and', 'post author', 'jetpack-mu-wpcom' ),
			];
		}, [] ) }
	</span>
);

export const getPostStatusLabel = ( post = {} ) =>
	post.post_status !== 'publish' ? (
		<div className="newspack-preview-label">
			{ { draft: __( 'Draft', 'jetpack-mu-wpcom' ), future: __( 'Scheduled', 'jetpack-mu-wpcom' ) }[ post.post_status ] }
		</div>
	) : null;
