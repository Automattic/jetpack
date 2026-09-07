import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import styles from './style.module.scss';
import type { FC } from 'react';

interface Props {
	// The post's permalink — used to render the breadcrumb/URL line.
	link: string;
	// The post title, used as the headline fallback when no custom SEO title.
	postTitle: string;
	// The custom SEO title (`jetpack_seo_html_title`), if set.
	customTitle: string;
	// The meta description (`advanced_seo_description`), if set.
	description: string;
}

/**
 * Turn a permalink into a Google-style breadcrumb line, e.g.
 * `example.com › blog › my-post`. Falls back to the raw link on a parse error.
 *
 * @param link - The post permalink.
 * @return The breadcrumb string.
 */
function toBreadcrumb( link: string ): string {
	try {
		const url = new URL( link );
		const segments = url.pathname.split( '/' ).filter( Boolean );
		return [ url.hostname, ...segments ].join( ' › ' );
	} catch {
		return link;
	}
}

/**
 * A small, hand-rolled Google search-result snippet: breadcrumb/URL line, blue
 * title, gray description. Updates live as the edit modal's fields change. The
 * title falls back to the post title when no custom SEO title is set; the
 * description is shown only when set. Intentionally not `@automattic/social-previews`.
 *
 * @param props             - Component props.
 * @param props.link        - The post permalink (breadcrumb/URL line).
 * @param props.postTitle   - The post title, used as the headline fallback.
 * @param props.customTitle - The custom SEO title, if set.
 * @param props.description - The meta description, if set.
 * @return The SERP preview snippet.
 */
const SerpPreview: FC< Props > = ( { link, postTitle, customTitle, description } ) => {
	const title = customTitle || postTitle;

	return (
		<Stack direction="column" gap="sm" className={ styles.preview }>
			<Text variant="heading-sm" className={ styles.muted }>
				{ __( 'Search engine preview', 'jetpack-seo' ) }
			</Text>
			<Stack direction="column" gap="xs">
				<Text variant="body-sm" className={ styles.muted }>
					{ toBreadcrumb( link ) }
				</Text>
				<div className={ styles.title }>{ title || __( '(no title)', 'jetpack-seo' ) }</div>
				{ description && (
					<Text variant="body-md" className={ styles.muted }>
						{ description }
					</Text>
				) }
			</Stack>
		</Stack>
	);
};

export default SerpPreview;
