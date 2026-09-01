import { connect } from '../utils/connection';
import { resolveSiteUrl } from '../utils/environment';

global.siteUrl = resolveSiteUrl();
connect();
