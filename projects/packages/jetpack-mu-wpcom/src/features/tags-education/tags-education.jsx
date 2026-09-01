import { localizeUrl } from '@automattic/i18n-utils';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { WpcomSupportLink } from '@automattic/jetpack-shared-extension-utils/components';
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
				<WpcomSupportLink
					supportLink={ localizeUrl( 'https://wordpress.com/support/posts/tags/' ) }
					supportPostId={ 8586 }
					onClick={ () => {
						tracks.recordEvent( 'jetpack_mu_wpcom_tags_education_link_click' );
					} }
				>
					{ window.wpcomTagsEducation.actionText }
				</WpcomSupportLink>
			</>
		);
	};
}, 'addTagsEducationLink' );

addFilter(
	'editor.PostTaxonomyType',
	'jetpack-mu-wpcom/add-tags-education-link',
	addTagsEducationLink
);
