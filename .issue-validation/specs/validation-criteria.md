# Issue Validation Criteria

## Decision Framework

When reviewing an issue, ask these questions:

### 1. Is the issue still relevant?
- ✅ **VALID** if: The problem/feature is still applicable to current codebase
- ❌ **INVALID** if: Already fixed, feature implemented, or no longer applicable

### 2. Is the issue actionable?
- ✅ **VALID** if: Clear steps to reproduce (bugs) or clear requirements (features)
- ⏸️ **NEEDS INFO** if: Vague description, missing reproduction steps, unclear requirements

### 3. Is the issue a duplicate?
- ❌ **INVALID** if: Duplicate of another issue (reference the original)
- ✅ **VALID** if: Unique issue

### 4. Does the issue have recent activity?
- ✅ **VALID** if: Activity within last 6 months
- ⚠️ **REVIEW** if: No activity for 6-12 months - verify if still relevant
- ❌ **LIKELY STALE** if: No activity for > 1 year - likely stale unless critical

### 5. Is the issue properly labeled?
- Update labels during validation:
  - Bug type: `[Type] Bug`, `[Feature] X`
  - Priority: `[Pri] High`, `[Pri] Normal`, `[Pri] Low`
  - Status: `[Status] Needs Author Reply`, `[Status] In Progress`
  - Metadata: `good first issue`, `help wanted`

## Automated Checks

The validation system automatically flags:

### Auto-Invalid Candidates
- Issues with "wontfix" or "duplicate" in comments
- Issues referencing deprecated features (check keywords)
- Issues with 0 engagement (0 comments, 0 reactions) for > 2 years

### Auto-Needs-Info Candidates
- Missing reproduction steps (for bugs)
- Reporter hasn't responded to questions for > 3 months
- Has label `[Status] Needs Author Reply` for > 3 months

### Auto-Valid Candidates
- Assigned to milestone
- Linked to active PR
- Activity within last 30 days
- Has `[Pri] High` or `[Pri] Critical` label

## Validation Categories

### Category A: High Confidence Invalid
Close immediately with template message:
- Duplicates (link to original)
- Already fixed (reference PR/commit)
- Deprecated features
- Spam/off-topic

### Category B: Likely Stale
Add comment requesting confirmation, set timeline (14 days):
- No activity > 1 year
- Original reporter inactive
- Unclear if still relevant

### Category C: Needs Triage
Bring to team attention:
- Complex issues requiring architectural decisions
- Feature requests needing product input
- Security concerns

### Category D: Valid - Needs Prioritization
Keep open, update labels:
- Confirmed bugs not yet fixed
- Accepted feature requests
- Documentation improvements

## Templates

### Closing Stale Issues
```
This issue hasn't had activity in over [X months/years]. We're doing a cleanup of older issues to ensure our backlog accurately reflects current priorities.

If this is still relevant, please comment with:
- Current version where you're experiencing this
- Updated reproduction steps if applicable

We'll reopen if there's confirmed ongoing relevance. Thanks!
```

### Requesting Information
```
Thanks for the report! To help us investigate, could you provide:
- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Jetpack version and relevant environment details
- [ ] Screenshots/logs if applicable

We'll follow up once we have this information.
```

## Efficiency Tips

1. **Batch by category**: Review all "no activity > 1 year" issues together
2. **Use labels**: Pre-filter by component/feature area
3. **Quick wins first**: Start with auto-invalid candidates
4. **Document patterns**: If multiple issues share same root cause, note for bulk updates
