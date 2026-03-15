---
applyTo: "**/changelog/**"
---

These are changelog entry files managed by the Jetpack changelogger tool. They follow this strict format:

```
Significance: patch|minor|major
Type: security|added|changed|deprecated|removed|fixed
Comment: optional comment explaining why no entry is needed

The changelog entry text goes here.
```

The `Significance` and `Type` lines are headers parsed by the changelogger — they are NOT part of the entry text. The entry text is everything after the blank line following the headers.

When reviewing these files:
- Do NOT suggest changes to the Significance or Type header format.
- DO review the entry text for grammar, clarity, and adherence to project conventions (imperative mood, capital letter, ends with period, user-facing description).
- Note: Jetpack plugin (`projects/plugins/jetpack/`) uses custom types: major, enhancement, compat, bugfix, other.
