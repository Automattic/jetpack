# Quick Start Guide - Issue Validation

## Get Started in 5 Minutes

### Step 1: Review the First Batch
The easiest wins are in **Category 2** - issues waiting for author reply for >3 months.

```bash
cd /home/user/jetpack/.issue-validation
cat reports/category-2-needs-reply.json
```

These 23 issues can likely be closed with a "no response" template.

### Step 2: Look at Stale Issues
**Category 1** has 484 issues with no activity for over a year.

```bash
# See the oldest issues
jq '.issues[0:10]' reports/category-1-likely-stale.json
```

Many of these can be closed after quick verification.

### Step 3: Use AI-Assisted Validation

For each issue, ask Claude Code to:
1. Open the issue URL
2. Read the description and comments
3. Determine if it's still valid based on validation criteria
4. Suggest an action (close, keep open, needs info)

Example prompt:
```
Review issue #12345 and determine if it should be closed as stale.
Check:
1. Is the problem still relevant to current codebase?
2. Has there been any recent activity?
3. Is it a duplicate of another issue?

Suggest whether to close with a comment or keep open.
```

### Step 4: Track Your Progress

As you validate issues, record them:

```bash
# Record a validation decision
echo '{"number": 12345, "decision": "invalid", "reason": "Already fixed in v1.2", "validated_at": "'$(date -Iseconds)'"}' >> progress/validated.jsonl
```

Or use the batch validation script:
```bash
./scripts/validate-batch.sh 10
```

## Batch Processing Workflow

### For Category 1 (Likely Stale - 484 issues)

1. **Get a batch** (10-50 issues):
```bash
jq '.issues[0:50]' reports/category-1-likely-stale.json > batch-1.json
```

2. **For each issue in batch**:
   - Visit the URL
   - Quick assessment (30 seconds):
     * Has the feature/component been deprecated?
     * Was it fixed in a recent release?
     * Is it a duplicate?
   - Decision: close, keep, or needs-info

3. **Take action**:
   - If closing: Add comment explaining why, then close
   - If keeping: Update labels/milestone
   - If needs info: Add "Needs Author Reply" label and comment

4. **Record decision** in progress/validated.jsonl

5. **Move to next batch**

### Time Estimates

**Per Issue:**
- Review: 15-30 seconds
- Decision: 5-10 seconds
- Action (if closing): 30-60 seconds
- **Total: 1-2 minutes per issue**

**Batches of 50:**
- With AI assistance: 30-60 minutes
- Manual review: 1.5-2 hours

**Full Category 1 (484 issues):**
- Optimistic: 8-10 hours
- Realistic: 12-16 hours
- Can be split across multiple sessions

## Issue Closure Templates

### Template 1: Stale Issue (No Response)
```
Thanks for reporting this! This issue hasn't had any activity in over [X] months/years.

We're doing a cleanup of older issues to keep our backlog current. If this is still relevant, please reply with:
- Current Jetpack version where you're experiencing this
- Updated reproduction steps if applicable

We'll reopen if there's confirmed ongoing relevance. Thanks for your understanding!
```

### Template 2: Already Fixed
```
Thanks for reporting! It looks like this was addressed in [version/PR #].

[Brief explanation of the fix]

Closing as resolved. If you're still experiencing this on the latest version, please open a new issue with updated details.
```

### Template 3: Duplicate
```
Thanks for the report! This appears to be a duplicate of #[original issue number].

Closing in favor of the original issue. Please follow that issue for updates and add any additional information there.
```

### Template 4: Needs Information
```
Thanks for reporting! To help us investigate, we need:

- [ ] Steps to reproduce
- [ ] Expected vs actual behavior
- [ ] Jetpack version and WordPress version
- [ ] Browser/environment details (if relevant)

Adding the "Needs Author Reply" label. We'll follow up once we have this information.
```

## Pro Tips

1. **Start with easy categories**: Category 2 (23 issues) is the fastest win

2. **Use browser tabs**: Open 10 issue URLs in tabs, quickly scan each

3. **Look for patterns**: Multiple issues about same component? May indicate bigger problem

4. **Don't overthink**: If unclear after 1 minute, mark as "needs-triage" and move on

5. **Take breaks**: Validating 50 issues at once can be tedious. Do batches of 10-25

6. **Use labels**: While reviewing, add missing labels for better organization

7. **Track time**: See how long your first batch takes to estimate remaining effort

## What to Do With Each Category

### ✅ Category 2 - Easiest (23 issues)
**Start here!** Just close with "no response" template. ~15 minutes total.

### ✅ Category 1 - Quick Wins (484 issues)
Many can be closed after 30-second review. ~4-8 hours total.

### ⚠️ Category 3 - Zero Engagement (198 issues)
Review for clarity. Close unclear/spam. ~2-3 hours total.

### ⚠️ Category 5 - Manual Review (332 issues)
Need careful review. More time per issue. ~4-6 hours total.

### ✅ Category 4 - Recently Active (44 issues)
Just verify labels/milestones. ~30 minutes total.

## Expected Outcomes

**Conservative estimate:**
- Close: 200-300 issues (~25-35%)
- Keep as valid: 400-500 issues
- Needs info: 100-150 issues

**Optimistic estimate:**
- Close: 400-500 issues (~45-55%)
- Keep as valid: 250-350 issues
- Needs info: 50-100 issues

**Impact:**
- Cleaner backlog
- Better focus on actionable issues
- Improved team efficiency
- Better community experience

## Ready?

Start with the easiest batch:
```bash
cd /home/user/jetpack/.issue-validation
cat reports/category-2-needs-reply.json
```

Pick the first issue, open the URL, and make your first validation decision!
