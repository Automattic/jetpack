# Issue Validation Process

## Overview
This directory contains the infrastructure to systematically validate ~2.5k open issues in the Jetpack repository.

## Directory Structure

- `data/` - Issue data and metadata
  - `issues.json` - Complete list of all open issues
  - `issues-metadata.json` - Additional metadata (comments count, last activity, etc.)
- `progress/` - Validation progress tracking
  - `validated.json` - Issues that have been reviewed
  - `invalid.json` - Issues marked as invalid/stale
  - `valid.json` - Issues confirmed as still valid
  - `needs-info.json` - Issues needing more information
- `scripts/` - Automation scripts
  - `fetch-issues.sh` - Fetch all open issues from GitHub
  - `validate-batch.sh` - Process a batch of issues
- `reports/` - Generated reports
- `specs/` - Specifications and criteria

## Process Workflow

### Phase 1: Data Collection
1. Fetch all open issues via GitHub API
2. Enrich with metadata (labels, comments, last update, etc.)
3. Store in structured format

### Phase 2: Categorization
Issues are automatically categorized by:
- Age (< 3 months, 3-6 months, 6-12 months, > 1 year)
- Activity (last comment/update date)
- Labels (bug, enhancement, needs-feedback, etc.)
- Project assignment
- Milestone status

### Phase 3: Validation
For each issue, determine:
- ✅ Still valid - Issue is relevant and actionable
- ❌ Invalid/Stale - Issue is outdated, duplicate, or no longer relevant
- ⏸️ Needs Info - Requires clarification from reporter
- 🔄 Needs Triage - Requires team discussion

### Phase 4: Action
Based on validation:
- Close stale issues with explanation
- Request info on unclear issues
- Update labels and milestones
- Prioritize valid issues

## Getting Started

1. Fetch all issues: `./scripts/fetch-issues.sh`
2. Review validation criteria: `specs/validation-criteria.md`
3. Start validating: Interactive or batch mode available
4. Track progress in `progress/` directory
