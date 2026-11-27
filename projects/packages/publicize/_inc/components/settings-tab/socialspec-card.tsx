import { SelectControl } from '@wordpress/components';
import { useEntityRecords } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { Card, Link, Stack, SwitchControl } from '@wordpress/ui';
import { store as socialStore } from '../../social-store';
import type { JSX } from 'react';

type Page = { id: number; title: { rendered: string } };

// The picker lists up to this many pages.
const PAGES_QUERY = {
	per_page: 100,
	status: 'publish',
	orderby: 'title',
	order: 'asc',
	_fields: 'id,title',
};

/**
 * Social web profile card: the switch for the SocialSpec documents, and the
 * page that is shared as About text.
 *
 * @return The card.
 */
export default function SocialspecCard(): JSX.Element {
	const { settings, isUpdating } = useSelect( select => {
		const store = select( socialStore );

		return {
			settings: store.getSocialSettings().socialspec,
			isUpdating: store.isSavingSiteSettings(),
		};
	}, [] );

	const { updateSocialspecSettings } = useDispatch( socialStore );

	// Only ask for the pages once the picker shows.
	const { records: pages } = useEntityRecords< Page >( 'postType', 'page', PAGES_QUERY, {
		enabled: settings.enabled,
	} );

	// Until a page is picked, the one the server uses anyway (the page at /about) is pre-selected.
	const selectedPage = String( settings.about_page || settings.default_about_page || '' );

	const options = useMemo(
		() => [
			...( selectedPage
				? []
				: [
						{ label: __( 'Select a page', 'jetpack-publicize-pkg' ), value: '', disabled: true },
					] ),
			...( pages ?? [] ).map( page => ( {
				label: decodeEntities( page.title.rendered ) || `#${ page.id }`,
				value: String( page.id ),
			} ) ),
		],
		[ pages, selectedPage ]
	);

	const onToggle = useCallback(
		( enabled: boolean ) => {
			updateSocialspecSettings( { enabled } );
		},
		[ updateSocialspecSettings ]
	);

	const onSelectPage = useCallback(
		( page: string ) => {
			updateSocialspecSettings( { about_page: Number( page ) } );
		},
		[ updateSocialspecSettings ]
	);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Social web profile', 'jetpack-publicize-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<SwitchControl
						label={ __(
							'Share a profile of this site with feed readers and social apps',
							'jetpack-publicize-pkg'
						) }
						checked={ settings.enabled }
						disabled={ isUpdating }
						onCheckedChange={ onToggle }
						description={ __(
							'Feed readers and social apps can then show this site like a profile: who it is, its About page and the feeds from your Blogroll blocks. Only what is already public on your site is shared.',
							'jetpack-publicize-pkg'
						) }
						details={
							<Link openInNewTab href="https://socialspec.org/">
								{ __( 'Learn more about SocialSpec', 'jetpack-publicize-pkg' ) }
							</Link>
						}
					/>
					{ settings.enabled && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'About page', 'jetpack-publicize-pkg' ) }
							value={ selectedPage }
							options={ options }
							disabled={ isUpdating }
							onChange={ onSelectPage }
							help={ __( 'The page that is shared as your About text.', 'jetpack-publicize-pkg' ) }
						/>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
