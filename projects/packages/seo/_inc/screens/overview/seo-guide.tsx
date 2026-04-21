/* eslint-disable jsdoc/require-returns, jsdoc/require-param-description, react/jsx-no-bind */

import { Button } from '@wordpress/components';
import { __, sprintf, _n } from '@wordpress/i18n';
import { Card, Stack, Text } from '@wordpress/ui';
import { useNavigate } from 'react-router';
import { useUpdateLlmsTxt } from '../../data/use-discoverability';
import { useUpdateSitemap } from '../../data/use-sitemap';
import CardSkeleton from './card-skeleton';
import SeverityDot from './severity-dot';
import useGuideItems, { toSeverity } from './use-guide-items';
import type { GuideAction, GuideItem } from './use-guide-items';
import type { OverviewResponse } from '../../data/overview-types';
import type { FC } from 'react';

interface Props {
	data?: OverviewResponse;
}

/**
 * The Overview screen's setup panel. Aggregates first-run configuration
 * items (sitemap, llms.txt, verification, …) into one prioritised list
 * so users have exactly one place to look for setup actions.
 * @param root0
 * @param root0.data
 */
const SeoGuide: FC< Props > = ( { data } ) => {
	const navigate = useNavigate();
	const updateSitemap = useUpdateSitemap();
	const updateLlmsTxt = useUpdateLlmsTxt();
	const items = useGuideItems( data );

	if ( ! data ) {
		return <CardSkeleton title={ __( 'SEO guide', 'jetpack-seo' ) } />;
	}

	const done = items.filter( i => i.status === 'done' ).length;
	const total = items.length;
	const allDone = done === total;

	const runAction = ( action: GuideAction ) => {
		if ( action.inline === 'enable_sitemap' ) {
			updateSitemap.mutate( { enabled: true } );
			return;
		}
		if ( action.inline === 'enable_llms_txt' ) {
			updateLlmsTxt.mutate( { enabled: true } );
			return;
		}
		if ( action.href ) {
			if ( action.external ) {
				window.location.assign( action.href );
			} else {
				navigate( action.href );
			}
		}
		action.onClick?.();
	};

	const mutationPending = updateSitemap.isPending || updateLlmsTxt.isPending;

	const subtitle = allDone
		? __( 'Search engines and AI assistants can discover and understand your site.', 'jetpack-seo' )
		: sprintf(
				/* translators: 1: completed item count, 2: total item count */
				_n( '%1$d of %2$d item complete.', '%1$d of %2$d items complete.', total, 'jetpack-seo' ),
				done,
				total
		  );

	return (
		<Card.Root>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<Stack direction="column" gap="lg">
						<Text
							variant="heading-sm"
							style={ { color: 'var(--wpds-color-fg-content-neutral-weak, #6d6d6d)' } }
						>
							{ __( 'SEO guide', 'jetpack-seo' ) }
						</Text>
						<Stack direction="column" gap="xs">
							<Text variant="heading-xl">
								{ allDone
									? __( "You're all set", 'jetpack-seo' )
									: sprintf(
											/* translators: %d: number of outstanding guide items */
											_n(
												'%d thing to address',
												'%d things to address',
												total - done,
												'jetpack-seo'
											),
											total - done
									  ) }
							</Text>
							<Text variant="body-sm">{ subtitle }</Text>
						</Stack>
					</Stack>

					<Stack direction="column" gap="sm">
						{ items.map( item => (
							<GuideRow
								key={ item.id }
								item={ item }
								pending={ mutationPending }
								onAction={ runAction }
							/>
						) ) }
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

interface RowProps {
	item: GuideItem;
	pending: boolean;
	onAction: ( action: GuideAction ) => void;
}

const GuideRow: FC< RowProps > = ( { item, pending, onAction } ) => (
	<Stack direction="row" gap="md" align="flex-start">
		<span
			// Match the title Text's `body-md` line-box (20px) so the dot is
			// vertically centred on the first line of title text — works for
			// one- and two-line items alike without a magic marginTop.
			style={ {
				display: 'inline-flex',
				alignItems: 'center',
				height: 'var(--wpds-typography-line-height-sm, 20px)',
			} }
		>
			<SeverityDot severity={ toSeverity( item.status ) } />
		</span>
		<Stack direction="column" gap="xs" style={ { flex: '1 1 auto' } }>
			<Text variant="body-md">{ item.title }</Text>
			{ item.hint && <Text variant="body-sm">{ item.hint }</Text> }
		</Stack>
		{ item.action && (
			<Button
				variant={ item.action.inline ? 'primary' : 'secondary' }
				size="compact"
				onClick={ () => onAction( item.action! ) }
				isBusy={ item.action.inline ? pending : false }
				disabled={ item.action.inline ? pending : false }
			>
				{ item.action.label }
			</Button>
		) }
	</Stack>
);

export default SeoGuide;
