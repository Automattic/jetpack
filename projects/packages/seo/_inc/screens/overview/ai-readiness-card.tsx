import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, Stack } from '@wordpress/ui';
import StatusDot from './status-dot';
import type { AiState } from '../../data/ai-types';
import type { FC } from 'react';

interface Props {
	enhancer: AiState[ 'enhancer' ] | null;
	llmsTxt: AiState[ 'llmsTxt' ] | null;
	crawlers: AiState[ 'crawlers' ] | null;
	onManage: () => void;
}

// Module-scope labels so the production minifier can't fold an adjacent
// `cond ? __(A) : __(B)` into `__(cond ? A : B)`, which would erase the literals
// from i18n extraction. See feedback_i18n_ternary_minifier_fold.
const llmsOnLabel = __( 'llms.txt generated', 'jetpack-seo' );
const llmsOffLabel = __( 'llms.txt not generated', 'jetpack-seo' );
const answerAllowedLabel = __( 'Answer engines allowed', 'jetpack-seo' );
const answerBlockedLabel = __( 'Some answer engines blocked', 'jetpack-seo' );
const trainingConfiguredLabel = __( 'Training privacy configured', 'jetpack-seo' );
const trainingOpenLabel = __( 'Training crawlers allowed', 'jetpack-seo' );
const enhancerOnLabel = __( 'AI-enhanced SEO enabled', 'jetpack-seo' );
const enhancerOffLabel = __( 'AI-enhanced SEO disabled', 'jetpack-seo' );
const enhancerUnavailableLabel = __( 'AI-enhanced SEO unavailable', 'jetpack-seo' );

/**
 * Overview "AI readiness" card: a factual snapshot of the four AI-tab settings
 * (llms.txt, answer-engine access, training-crawler privacy, the AI SEO
 * enhancer), each shown as a status row, with a button through to the AI tab.
 * Like the other Overview cards it reports state — it is not a graded score.
 *
 * @param props          - Component props.
 * @param props.enhancer - AI SEO Enhancer state (or null when absent).
 * @param props.llmsTxt  - llms.txt state (or null when absent).
 * @param props.crawlers - AI-crawler state (or null when absent).
 * @param props.onManage - Navigate to the AI tab.
 * @return The AI readiness card.
 */
const AiReadinessCard: FC< Props > = ( { enhancer, llmsTxt, crawlers, onManage } ) => {
	const llmsOn = !! llmsTxt?.enabled;

	const blocked = crawlers?.blocked ?? [];
	const catalog = crawlers?.catalog ?? [];

	// Answer engines are "allowed" when none of them are blocked; training
	// privacy is "configured" when every training crawler is blocked.
	const answerEngines = catalog.filter( crawler => crawler.type === 'answer' );
	const answerAllowed =
		answerEngines.length > 0 &&
		answerEngines.every( crawler => ! blocked.includes( crawler.slug ) );

	const trainingCrawlers = catalog.filter( crawler => crawler.type === 'training' );
	const trainingConfigured =
		trainingCrawlers.length > 0 &&
		trainingCrawlers.every( crawler => blocked.includes( crawler.slug ) );

	const enhancerOn = !! ( enhancer?.available && enhancer.enabled );
	// The Enhancer is plan-gated; distinguish "off" from "not on your plan". Typed
	// as string so the distinct branded `__()` literal types can share the binding.
	let enhancerLabel: string = enhancerUnavailableLabel;
	if ( enhancer?.available ) {
		enhancerLabel = enhancer.enabled ? enhancerOnLabel : enhancerOffLabel;
	}

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'AI readiness', 'jetpack-seo' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="xs">
					<StatusDot
						status={ llmsOn ? 'ok' : 'warn' }
						label={ llmsOn ? llmsOnLabel : llmsOffLabel }
					/>
					<StatusDot
						status={ answerAllowed ? 'ok' : 'warn' }
						label={ answerAllowed ? answerAllowedLabel : answerBlockedLabel }
					/>
					<StatusDot
						status={ trainingConfigured ? 'ok' : 'warn' }
						label={ trainingConfigured ? trainingConfiguredLabel : trainingOpenLabel }
					/>
					<StatusDot status={ enhancerOn ? 'ok' : 'warn' } label={ enhancerLabel } />
				</Stack>
				<div className="jetpack-seo-overview__card-footer">
					<Button variant="secondary" onClick={ onManage }>
						{ __( 'Manage AI', 'jetpack-seo' ) }
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	);
};

export default AiReadinessCard;
