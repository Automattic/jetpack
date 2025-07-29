import { resolveSiteUrl } from '../helpers/utils-helper.js';
import { connect } from '../utils/connection.ts';

global.siteUrl = resolveSiteUrl();
connect();
