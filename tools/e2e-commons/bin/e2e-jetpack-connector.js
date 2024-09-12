import { prerequisitesBuilder } from '../env/prerequisites.js';
import { resolveSiteUrl } from '../helpers/utils-helper.js';

global.siteUrl = resolveSiteUrl();
prerequisitesBuilder().withConnection( true ).build();
