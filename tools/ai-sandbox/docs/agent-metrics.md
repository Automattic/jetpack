# Agent Metrics for Premium Analytics

This document defines how to measure the effectiveness of the agent
governance system for `projects/packages/premium-analytics`.

## Core Metric

**Agent Clean Rate = Clean sessions / (Clean + Violation sessions)**

Target: Violation count trends toward zero over time.

Session outcomes are classified as:

| Outcome | Definition |
|---------|------------|
| Clean | Agent completed the task within contract bounds; PR merged without significant rework |
| Escalated | Agent correctly stopped and requested human review |
| Violation | Agent breached a contract rule (edited a restricted file, invented a data layer, etc.) |

Escalated sessions are expected behavior and do not count against the Clean Rate.

## Per-PR Session Report

Every agent-generated PR must include the following block in its description:

```
## Agent Session Report
- Scope respected: yes / no
- Escalations triggered: N
- Contract violations: none / [describe]
- Human rework needed: none / minor / major
```

This requires no tooling. Data lives in PR history and can be audited at any time.

## Post-Launch Dashboard Metric

**Routes shipped per sprint — agent-assisted vs. manual**

This metric is suitable for a team dashboard because:

- routes have a well-defined contract, making comparisons fair
- it reflects real product velocity, not just process compliance
- it remains meaningful as the package grows

## Feedback Loop

Review the session reports at the end of each sprint.

Ask:

- Did any Violation reveal a gap in the contract docs?
- Did any Escalation turn out to be unnecessary? (contract may be too conservative)
- Is human rework concentrated in a specific area? (likely needs a new contract rule)

Update the relevant contract doc when a pattern is found.
