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

export const JetpackModuleToProductCard: {
	[ key in JetpackModule ]: React.FC< { recommendation?: boolean; admin?: boolean } > | null;
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
	// Features:
	newsletter: NewsletterCard,
	'related-posts': RelatedPostsCard,
	'site-accelerator': SiteAcceleratorCard,
};
