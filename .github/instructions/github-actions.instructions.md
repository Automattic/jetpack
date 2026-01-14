---
applyTo: "projects/github-actions/**/*,.github/workflows/**/*.{yml,yaml}"
---

# GitHub Actions Instructions

## GitHub Actions Structure

GitHub Actions in `projects/github-actions/` are reusable actions with the naming convention `automattic/action-{name}`.

## Action Files

- `action.yml` or `action.yaml` - Action metadata and definition
- Action can be JavaScript, Docker, or composite
- Must have clear `name`, `description`, `inputs`, and `outputs`

## Workflow Files

Workflows in `.github/workflows/` define CI/CD pipelines.

## Key Workflows

- `build.yml` - Main build workflow for all projects
- `linting.yml` - Linting checks (PHP, JS, CSS)
- `e2e-tests.yml` - End-to-end tests
- `autotagger.yml` - Automated version tagging
- `post-build.yml` - Post-build checks and deployments

## Workflow Patterns

- Use reusable workflows where possible
- Use composite actions for shared steps
- Cache dependencies (composer, pnpm, etc.)
- Use matrix builds for multiple PHP/Node versions
- Fail fast for quick feedback
- Use appropriate timeouts

## Environment Variables

Common environment variables:
- `GITHUB_TOKEN` - GitHub API token (secrets.GITHUB_TOKEN)
- `NODE_VERSION` - Node.js version (from .nvmrc)
- `PHP_VERSION` - PHP version for testing

## Secrets

- Never commit secrets to repository
- Use GitHub Secrets for sensitive data
- Reference with `${{ secrets.SECRET_NAME }}`
- Document required secrets in action README

## Testing Actions

- Test actions in draft PRs before merging
- Use workflow_dispatch for manual testing
- Check action logs for errors
- Validate inputs and outputs

## Best Practices

- Keep actions focused and single-purpose
- Document all inputs and outputs
- Provide sensible defaults for inputs
- Use semantic versioning for action releases
- Pin action versions in workflows (e.g., `@v1`, not `@main`)
- Add error handling and informative error messages

## Debugging Workflows

- Use `jobs.<job-id>.steps[*].run: env` to print environment
- Enable debug logging with secrets.ACTIONS_STEP_DEBUG
- Check workflow run logs in GitHub UI
- Use `act` for local workflow testing (with limitations)
