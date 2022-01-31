import { prerequisitesBuilder } from '../env/prerequisites.js';
import { resolveSiteUrl } from '../helpers/utils-helper.cjs';

global.siteUrl = resolveSiteUrl();
prerequisitesBuilder().withConnection( true ).build();
