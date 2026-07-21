import AiCard from './ai-card';
import AntiSpamCard from './anti-spam-card';
import BackupCard from './backup-card';
import BoostCard from './boost-card';
import CompleteCard from './complete-card';
import CrmCard from './crm-card';
import GrowthCard from './growth-card';
import NewsletterCard from './newsletter-card';
import ProtectCard from './protect-card';
import RelatedPostsCard from './related-posts-card';
import SearchCard from './search-card';
import SecurityCard from './security-card';
import SiteAcceleratorCard from './site-accelerator-card';
import SocialCard from './social-card';
import StatsCard from './stats-card';
import VideopressCard from './videopress-card';
import type { FC } from 'react';

export const JetpackModuleToProductCard: {
	[ key in JetpackModule ]: FC< { recommendation?: boolean; admin?: boolean } > | null;
} = {
	backup: BackupCard,
	protect: ProtectCard,
	'anti-spam': AntiSpamCard,
	boost: BoostCard,
	search: SearchCard,
	videopress: VideopressCard,
	stats: StatsCard,
	crm: CrmCard,
	social: SocialCard,
	ai: AiCard,
	'jetpack-ai': AiCard,
	security: SecurityCard,
	growth: GrowthCard,
	complete: CompleteCard,
	// Not existing:
	extras: null,
	scan: null,
	creator: null,
	'brute-force': null,
	// A real product, but shown as a tab-panel card; it has no homepage card component:
	'jetpack-forms': null,
	// Features:
	newsletter: NewsletterCard,
	'related-posts': RelatedPostsCard,
	// Shown only as a module row under Growth; no product card.
	podcast: null,
	'site-accelerator': SiteAcceleratorCard,
};
