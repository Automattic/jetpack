import { connect } from '../utils/connection.ts';
import { resolveSiteUrl } from '../utils/environment.ts';

global.siteUrl = resolveSiteUrl();
connect();
