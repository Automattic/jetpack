/* eslint-disable jsdoc/require-returns, jsdoc/require-param-description */

/* eslint-disable react/jsx-no-bind */

import { Notice, Spinner, ToggleControl } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { useAiCrawlers, useUpdateAiCrawlers } from '../../data/use-discoverability';
import styles from './style.module.scss';
import type { FC, ReactNode } from 'react';

const LABELS: Record< string, string > = {
	GPTBot: 'OpenAI (GPTBot)',
	ClaudeBot: 'Anthropic (ClaudeBot)',
	'Google-Extended': 'Google (Google-Extended)',
	PerplexityBot: 'Perplexity (PerplexityBot)',
	CCBot: 'Common Crawl (CCBot)',
	'anthropic-ai': 'Anthropic (anthropic-ai)',
};

interface Props {
	id?: string;
	defaultOpen?: boolean;
}

/**
 * AI crawler toggle grid — free for all plans per the PRD. Writes to a
 * single option which the PHP `AI_Crawlers::filter_robots_txt()` filter
 * reads when generating /robots.txt.
 * @param root0
 * @param root0.id
 * @param root0.defaultOpen
 */
const AiCrawlersCard: FC< Props > = ( { id, defaultOpen = false } ) => {
	const { data, isLoading, isError, error } = useAiCrawlers();
	const mutation = useUpdateAiCrawlers();

	const setCrawler = ( bot: string, block: boolean ) => {
		if ( ! data ) return;
		const crawlers = { ...data.crawlers, [ bot ]: block ? 'block' : 'allow' } as Record<
			string,
			'allow' | 'block'
		>;
		mutation.mutate( { crawlers } );
	};

	const blockedCount = data
		? data.known.filter( bot => data.crawlers[ bot ] === 'block' ).length
		: 0;
	const totalCount = data ? data.known.length : 0;

	let body: ReactNode;
	if ( isLoading || ! data ) {
		body = <Spinner />;
	} else if ( isError ) {
		body = (
			<Notice status="error" isDismissible={ false }>
				{ error?.message ?? __( 'Unable to load AI crawler settings.', 'jetpack-seo' ) }
			</Notice>
		);
	} else {
		body = (
			<>
				<p>
					{ __(
						'Block AI crawlers from indexing your content. Rules are applied via robots.txt.',
						'jetpack-seo'
					) }
				</p>
				<div className={ styles.crawlerGrid }>
					{ data.known.map( bot => (
						<div key={ bot } className={ styles.crawlerCell }>
							<span>{ LABELS[ bot ] ?? bot }</span>
							<ToggleControl
								label={ __( 'Block', 'jetpack-seo' ) }
								checked={ data.crawlers[ bot ] === 'block' }
								onChange={ checked => setCrawler( bot, checked ) }
								disabled={ mutation.isPending }
								__nextHasNoMarginBottom
							/>
						</div>
					) ) }
				</div>
			</>
		);
	}

	return (
		<CollapsibleCard.Root id={ id } defaultOpen={ defaultOpen }>
			<CollapsibleCard.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'AI crawlers', 'jetpack-seo' ) }</Card.Title>
					{ data && (
						<Badge intent={ blockedCount > 0 ? 'informational' : 'draft' }>
							{ blockedCount > 0
								? sprintf(
										/* translators: 1: number of blocked AI crawlers, 2: total number of known AI crawlers */
										__( '%1$d of %2$d blocked', 'jetpack-seo' ),
										blockedCount,
										totalCount
								  )
								: __( 'All allowed', 'jetpack-seo' ) }
						</Badge>
					) }
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>{ body }</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default AiCrawlersCard;
