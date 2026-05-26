---
description: Create a changelog entry for a Jetpack project using the changelogger tool
---

Create a changelog entry for a Jetpack project.

Instructions:
1. Check git changes to identify which project was modified: `git diff --name-only trunk..HEAD`
2. Analyze the changes to determine:
   - Which project was modified (look at file paths)
   - Significance level (patch for bug fixes, minor for features, major for breaking changes)
   - Type based on the nature of changes and project type
   - Description by summarizing the changes
3. Run the changelogger command via the Jetpack CLI:
   ```bash
   jetpack changelog add <project> \
     --no-interaction \
     --significance={significance} \
     --type={type} \
     --entry="{description}"
   ```
   Where `<project>` is the slug, e.g. `plugins/jetpack`.
4. Stage the generated changelog file with `git add`

Project types reference:
- Jetpack Plugin (projects/plugins/jetpack): major, enhancement, compat, bugfix, other
  (See projects/plugins/jetpack/composer.json:134-140)
- Other Plugins (projects/plugins/*): added, changed, deprecated, removed, fixed, security
  (Uses changelogger default types)
- Packages (projects/packages/*): added, changed, deprecated, removed, fixed, security
  (Default types from changelogger, see projects/packages/changelogger/tests/php/tests/src/ValidateCommandTest.php:103)
- GitHub Actions (projects/github-actions/*): added, changed, deprecated, removed, fixed, security
  (Uses changelogger default types)
- JS Packages (projects/js-packages/*): added, changed, deprecated, removed, fixed, security
  (Uses changelogger default types)

Deduce everything from the git changes - do not ask the user for input.
