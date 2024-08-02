import AiCard from './ai-card';
import AntiSpamCard from './anti-spam-card';
import BackupCard from './backup-card';
import BoostCard from './boost-card';
import CreatorCard from './creator-card';
import CrmCard from './crm-card';
import ProtectCard from './protect-card';
import SearchCard from './search-card';
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
	creator: CreatorCard,
	social: SocialCard,
	ai: AiCard,
	'jetpack-ai': AiCard,
	// Not existing:
	extras: null,
	scan: null,
	security: null,
};
