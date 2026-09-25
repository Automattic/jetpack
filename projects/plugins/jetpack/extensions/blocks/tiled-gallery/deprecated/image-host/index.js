import attributes from './attributes';
import { savePhotonDomain, saveSiteHost } from './save';
import supports from './supports';

// Two deprecations carrying the current markup, one per image host — see ./save.jsx for why both
// exist and why neither may be edited to follow the current save().
export const photonDomain = { attributes, supports, save: savePhotonDomain };
export const siteHost = { attributes, supports, save: saveSiteHost };
