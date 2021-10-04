import { prerequisitesBuilder } from '../env/prerequisites';
import { resolveSiteUrl } from '../helpers/utils-helper';

/**
 * 1. pnpm tunnel:on
 * 2. pnpm env:start
 * 3. export NODE_ENV=test
 * 4. export NODE_CONFIG_DIR="/Users/brbrr/Developer/a8c/jetpack/projects/plugins/jetpack/tests/e2e/config"
 * 5. pnpm babel-node bin/e2e-jetpack-connector.js
 */

global.siteUrl = resolveSiteUrl();
prerequisitesBuilder().withConnection( true ).build();
