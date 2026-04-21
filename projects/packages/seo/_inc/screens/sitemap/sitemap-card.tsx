/* eslint-disable react/jsx-no-bind */

import { Button, ExternalLink, Notice, Spinner, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { useSitemap, useUpdateSitemap } from '../../data/use-sitemap';
import type { FC, ReactNode } from 'react';

interface Props {
	id?: string;
	defaultOpen?: boolean;
}

const SitemapCard: FC< Props > = ( { id, defaultOpen = false } ) => {
	const { data, isLoading, isError, error } = useSitemap();
	const mutation = useUpdateSitemap();

	const copy = ( url: string ) => {
		if ( typeof navigator !== 'undefined' && navigator.clipboard ) {
			navigator.clipboard.writeText( url );
		}
	};

	let body: ReactNode;
	if ( isLoading || ! data ) {
		body = <Spinner />;
	} else if ( isError ) {
		body = (
			<Notice status="error" isDismissible={ false }>
				{ error?.message ?? __( 'Unable to load sitemap settings.', 'jetpack-seo' ) }
			</Notice>
		);
	} else {
		body = (
			<>
				<ToggleControl
					label={ __( 'Generate XML sitemap', 'jetpack-seo' ) }
					help={ __(
						'Jetpack publishes an XML sitemap that search engines crawl to discover your content.',
						'jetpack-seo'
					) }
					checked={ data.enabled }
					onChange={ enabled => mutation.mutate( { enabled } ) }
					disabled={ mutation.isPending }
					__nextHasNoMarginBottom
				/>

				{ data.enabled && (
					<ul>
						<li>
							<ExternalLink href={ data.urls.sitemap }>{ data.urls.sitemap }</ExternalLink>
							<Button variant="tertiary" onClick={ () => copy( data.urls.sitemap ) }>
								{ __( 'Copy', 'jetpack-seo' ) }
							</Button>
						</li>
						<li>
							<ExternalLink href={ data.urls.news_sitemap }>
								{ data.urls.news_sitemap }
							</ExternalLink>
							<Button variant="tertiary" onClick={ () => copy( data.urls.news_sitemap ) }>
								{ __( 'Copy', 'jetpack-seo' ) }
							</Button>
						</li>
					</ul>
				) }
			</>
		);
	}

	return (
		<CollapsibleCard.Root id={ id } defaultOpen={ defaultOpen }>
			<CollapsibleCard.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'Sitemap', 'jetpack-seo' ) }</Card.Title>
					{ data && (
						<Badge intent={ data.enabled ? 'stable' : 'draft' }>
							{ data.enabled ? __( 'Active', 'jetpack-seo' ) : __( 'Inactive', 'jetpack-seo' ) }
						</Badge>
					) }
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>{ body }</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default SitemapCard;
