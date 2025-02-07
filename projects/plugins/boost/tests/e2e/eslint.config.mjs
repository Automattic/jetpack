import { makeE2eConfig } from '_jetpack-e2e-commons/eslint.config.mjs';

export default [ ...makeE2eConfig( import.meta.url ) ];
