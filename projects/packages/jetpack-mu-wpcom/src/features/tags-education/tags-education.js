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
					url={ localizeUrl( 'https://wordpress.com/support/posts/tags/' ) }
					postId={ 8586 }
					text={ window.wpcomTagsEducation.actionText }
					onClick={ () => {
						tracks.recordEvent( 'jetpack_mu_wpcom_tags_education_link_click' );
					} }
				/>
			</>
		);
	};
}, 'addTagsEducationLink' );

addFilter(
	'editor.PostTaxonomyType',
	'jetpack-mu-wpcom/add-tags-education-link',
	addTagsEducationLink
);
