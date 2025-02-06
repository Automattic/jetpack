/**
 * Export components.
 */
export * from './social-logo';
import { SocialLogo } from './social-logo';
export { SocialLogoData } from './social-logo-data';

/**
 * @deprecated Use named import instead - `import { SocialLogo } from 'social-logos';`
 */
const DeprecatedDefaultImport = SocialLogo;

export default DeprecatedDefaultImport;
