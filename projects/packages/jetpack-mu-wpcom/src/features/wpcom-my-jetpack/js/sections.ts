import { __ } from '@wordpress/i18n';
import type { Tool } from './types.ts';

/**
 * The sections, in page order.
 *
 * @return Each section's key, title and blurb.
 */
export function getSections() {
	return [
		{
			key: 'security',
			title: __( 'Security', 'jetpack-mu-wpcom' ),
			blurb: __( 'Keep your site and its visitors safe.', 'jetpack-mu-wpcom' ),
		},
		{
			key: 'growth',
			title: __( 'Growth', 'jetpack-mu-wpcom' ),
			blurb: __( 'Bring in visitors and earn from your content.', 'jetpack-mu-wpcom' ),
		},
		{
			key: 'content',
			title: __( 'Content', 'jetpack-mu-wpcom' ),
			blurb: __( 'Collect, publish and find what is on your site.', 'jetpack-mu-wpcom' ),
		},
		{
			key: 'more',
			title: __( 'More', 'jetpack-mu-wpcom' ),
			blurb: __( 'Other Jetpack tools on this site.', 'jetpack-mu-wpcom' ),
		},
	];
}

/**
 * Sorts tools into the page's sections, keeping menu order within each and dropping empty sections.
 *
 * @param tools - The tools, in menu order.
 * @return The sections that have tools, each with its tools.
 */
export function groupTools( tools: Tool[] ) {
	const sections = getSections();
	const keys = sections.map( section => section.key );
	const sectionOf = ( tool: Tool ) => ( keys.includes( tool.section ) ? tool.section : 'more' );

	return sections
		.map( section => ( {
			...section,
			tools: tools.filter( tool => sectionOf( tool ) === section.key ),
		} ) )
		.filter( section => section.tools.length );
}
