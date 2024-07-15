import { localizeUrl } from '@automattic/i18n-utils';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

const addTagsEducationLink = createHigherOrderComponent( PostTaxonomyType => {
	return props => {
		const { tracks } = useAnalytics();

		if ( props.slug !== 'post_tag' || ! window.wpcomTagsEducation ) {
			return <PostTaxonomyType { ...props } />;
		}

		return (
			<>
				<PostTaxonomyType { ...props } />
				<ExternalLink
					href={ localizeUrl( 'https://wordpress.com/support/posts/tags/' ) }
					onClick={ () => {
						tracks.recordEvent( 'jetpack_mu_wpcom_tags_education_link_click' );
					} }
				>
					{ window.wpcomTagsEducation.actionText }
				</ExternalLink>
			</>
		);
	};
}, 'addTagsEducationLink' );

addFilter(
	'editor.PostTaxonomyType',
	'jetpack-mu-wpcom/add-tags-education-link',
	addTagsEducationLink
);
