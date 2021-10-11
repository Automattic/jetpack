import { prerequisitesBuilder } from '../env/prerequisites';
import { resolveSiteUrl } from '../helpers/utils-helper';

global.siteUrl = resolveSiteUrl();
prerequisitesBuilder().withConnection( true ).build();
