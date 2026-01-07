# wp-env Migration Plan

This document tracks the migration from the custom Docker setup to `@wordpress/env`.

## Current Status: Phase 1 - Parallel Implementation

---

## Pros & Cons Comparison

| Aspect | Current Setup | wp-env |
|--------|--------------|--------|
| **Maintenance** | Heavy - custom Dockerfile, shell scripts, Docker Compose files | Light - maintained by WordPress core team |
| **Learning Curve** | Jetpack-specific, non-transferable knowledge | Standard across WordPress ecosystem |
| **Documentation** | Internal only | Official WordPress docs |
| **Updates** | Manual - PHP, WP, tooling versions managed separately | Auto - `--update` flag, tracks WP releases |
| **Multi-plugin** | Auto-symlinks all monorepo plugins | Requires explicit config per plugin |
| **PHPUnit** | Pre-configured with custom targets | Built-in test environment |
| **Multisite** | `multisite-convert` command | Native `multisite: true` config |
| **Email Testing** | Mailpit built-in | Not included (needs custom mapping) |
| **phpMyAdmin** | Built-in | Optional via `phpmyadminPort` |
| **SFTP** | Built-in for IDE integration | Not supported |
| **Xdebug** | Pre-configured | `--xdebug` flag |
| **Tunneling** | Jurassic Tube + ngrok | Not built-in |
| **Port Config** | Flexible via env vars | Via `.wp-env.json` |
| **Lifecycle Scripts** | Custom shell scripts | Native `lifecycleScripts` |
| **Data Persistence** | Local `data/` dir | Hidden `~/.wp-env/` dir |
| **Ecosystem** | Jetpack-only | Used by Gutenberg, many plugins |
| **Complexity** | ~2000+ lines of config/scripts | Simple `.wp-env.json` |

---

## Key Challenges

1. **Auto-symlinking**: Current setup auto-discovers and symlinks all 20+ monorepo plugins. wp-env requires explicit listing in `plugins` array.

2. **E2E Testing**: Current setup has special e2e configuration with different ports and services. wp-env has separate `tests` environment but less flexible.

3. **Jurassic Tube**: No wp-env equivalent - would need wrapper script.

4. **Mailpit/SFTP**: Not in wp-env - would require Docker Compose override or removal.

5. **Custom Scripts**: `run.sh`, `install.sh`, `multisite-convert.sh` etc. would need conversion to lifecycle scripts.

6. **PHPUnit Targets**: Current setup has specialized targets (jetpack, jp-multisite, jp-wpcomsh, crm, wpcomsh). These would need adaptation.

---

## Migration Phases

### Phase 1: Parallel Implementation
- [x] Add `@wordpress/env` as dev dependency (added to root package.json)
- [x] Create `.wp-env.json` at monorepo root (created with all plugins except wpcloud-sso)
- [x] Add validation to ensure `.wp-env.json` stays in sync with `projects/plugins/`
  - Added check to `.github/files/lint-project-structure.sh`
  - CI will fail if new plugins are added without updating `.wp-env.json`
- [x] Manual testing completed
  - WordPress accessible on port 8888
  - All 19 plugins detected (inactive until built)
  - MU-plugins loaded correctly from `tools/docker/mu-plugins`
  - **Key finding**: Plugins need `composer install` before activation (unlike current setup which mounts monorepo)
- [x] Implement `jp wp-env` commands
  - Added to `projects/js-packages/jetpack-cli/bin/jp.js` to handle host-side execution
  - Added `tools/cli/commands/wp-env.js` for yargs command definitions
  - Commands: `start`, `stop`, `destroy`, `clean`, `run`, `wp`, `sh`, `logs`, `status`, `install-path`
  - Falls back to npx if local wp-env not installed
- [x] Both systems coexist - `jp docker` and `jp wp-env` are independent
- [x] Document new commands in README (added to `tools/docker/README.md`)
- [x] All commands tested and verified:
  - `jp wp-env status` - Shows running containers
  - `jp wp-env start` - Starts environment (port 8888)
  - HTTP checks: Homepage (200), wp-login (200), login form present
  - Site title shows "jetpack", WordPress 6.9, PHP 8.2
  - `jp wp-env wp plugin list` - Lists all 19 plugins
  - `jp wp-env wp option get siteurl` - Returns http://localhost:8888
  - `jp wp-env install-path` - Shows ~/.wp-env/<hash>
  - `jp wp-env logs` - Streams container logs
  - `jp wp-env stop` - Stops containers
  - `jp wp-env destroy` - Removes all data

### Phase 2: Feature Parity
- [ ] Create lifecycle scripts for plugin symlinking
- [ ] Add Docker Compose override for Mailpit (optional)
- [ ] Create wrapper for Jurassic Tube compatibility
- [ ] Port PHPUnit configurations
- [ ] Implement multisite support
- [ ] Add Xdebug configuration

### Phase 3: CLI Migration
- [ ] Update `jetpack docker` commands to use wp-env under the hood
- [ ] Maintain backward-compatible command interface
- [ ] Deprecate custom Docker files
- [ ] Update E2E test infrastructure

### Phase 4: Cleanup
- [ ] Remove old Dockerfile and compose files
- [ ] Update documentation
- [ ] Remove deprecated commands
- [ ] Archive old scripts for reference

---

## Testing Checklist

### Pre-Migration Baseline (Document Current Behavior)

```bash
# 1. Start current environment
jetpack docker up -d

# 2. Verify WordPress accessible
curl -I http://localhost/

# 3. Check all plugins symlinked
jetpack docker wp plugin list

# 4. Run PHPUnit tests
jetpack docker phpunit jetpack
jetpack docker phpunit crm

# 5. Test WP-CLI access
jetpack docker wp option get siteurl

# 6. Test multisite conversion
jetpack docker multisite-convert
jetpack docker wp site list

# 7. Verify email capture (Mailpit)
curl http://localhost:1080/api/v1/messages

# 8. Verify phpMyAdmin
curl -I http://localhost:8181/

# 9. Clean up
jetpack docker clean
```

### Post-Migration Testing

| Test | Command | Expected Result |
|------|---------|-----------------|
| **Environment Start** | `jetpack docker up -d` | WordPress accessible at configured port |
| **WordPress Admin** | Visit `/wp-admin/` | Login works with default credentials |
| **Plugin Activation** | `jetpack docker wp plugin list` | All monorepo plugins symlinked & available |
| **Jetpack Plugin** | Activate Jetpack in admin | No errors, dashboard renders |
| **WP-CLI** | `jetpack docker wp --info` | PHP/WP versions correct |
| **PHPUnit - Jetpack** | `jetpack docker phpunit jetpack` | Tests pass (or same failures as baseline) |
| **PHPUnit - Multisite** | `jetpack docker phpunit jp-multisite` | Tests pass |
| **Debug Log** | `jetpack docker tail` | Shows WordPress debug output |
| **Database Access** | `jetpack docker db` | MySQL CLI accessible |
| **Shell Access** | `jetpack docker sh` | Bash shell in container |
| **Core Update** | `jetpack docker update-core 6.7` | WordPress version changes |
| **Clean** | `jetpack docker clean` | All data removed, fresh start works |
| **E2E Environment** | `jetpack docker up -t e2e -d` | Separate environment on port 8889 |
| **Xdebug** | Enable Xdebug, set breakpoint | Debugger connects |

### E2E Test Suite Verification

```bash
# Run existing E2E tests to ensure they still work
pnpm jetpack test e2e jetpack
pnpm jetpack test e2e boost
```

### Developer Workflow Tests

1. **Hot Reload**: Edit a PHP file, verify change appears without restart
2. **Build Watch**: Run `jetpack watch jetpack`, verify JS changes reflected
3. **New Plugin**: Run `jetpack generate plugin`, verify it appears in Docker
4. **Link/Unlink**: Test `jetpack docker link-plugin` and `unlink-plugin`

### Performance Comparison

```bash
# Measure startup time
time jetpack docker up -d  # Current
time wp-env start          # New

# Measure command execution
time jetpack docker wp plugin list
time wp-env run cli wp plugin list
```

---

## References

- [wp-env Documentation](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/)
- [Current Docker README](./README.md)