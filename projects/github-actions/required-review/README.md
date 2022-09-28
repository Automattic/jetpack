# GitHub Required Review Check

This [Github Action](https://github.com/features/actions) will check that required reviewers have
accepted the PR, setting a status check accordingly.

## Example

```yaml
name: Required review check
on:
  pull_request_review:
  pull_request:
    types: [ opened, reopened, synchronize ]

jobs:
  check:
    name: Checking required reviews
    runs-on: ubuntu-latest

    # GitHub should provide a "pull_request_review_target", but they don't and
    # the action will fail if run on a forked PR.
    if: github.event.pull_request.head.repo.full_name == github.event.pull_request.base.repo.full_name

    steps:
      - uses: Automattic/action-required-review@v3
        with:
          token: ${{ secrets.REQUIRED_REVIEWS_TOKEN }}
          requirements: |
            - paths: unmatched
              teams:
                - maintenance
```

## Usage

This action is intended to be triggered by the `pull_request_review` event.

```yaml
- uses: Automattic/action-required-review
  with:
    # Specify the requirements as a YAML string. See below for the format of this string.
    # The easiest way to generate this is probably to write your YAML, then put the `|`
    # after the key to make it a string.
    requirements: |
      - name: Docs
        paths:
         - 'docs/'
        teams:
          - documentation

      - name: Everything else
        paths: unmatched
        teams:
          - maintenance

    # Specify the path to the requirements file. See below for the format of
    # this file.
    requirements-file: .github/required-review.yaml

    # Specify the "context" for the status to set. This is what shows up in the
    # PR's checks list.
    status: Required review

    # By default, 'review required' statuses will be set to pending. Set
    # this to instead fail the status checks instead of leaving them pending.
    fail: true

    # GitHub Access Token. The user associated with this token will show up
    # as the "creator" of the status check, and must have access to read
    # pull request data, create status checks (`repo:status`), and to read
    # your organization's teams (`read:org`).
    token: ${{ secrets.SOME_TOKEN }}
```

## Requirements Format

The requirements consist of an array of requirement objects. A requirement object has the following keys:

* `name` is an optional informative name for the requirement.
* `paths` is an array of path patterns, or the string "unmatched". If an array, the reviewers
  specified will be checked if any path in the array matches any path in the PR. If the string
  "unmatched", the reviewers are checked if any file in the PR has not been matched yet.
* `teams` is an array of strings that are GitHub team slugs in the organization or repository. A
  review is required from a member of any of these teams.

  Instead of a string, a single-keyed object may be specified. The key is either `all-of` or
  `any-of`, and the value is an array as for `teams`. When the key is `all-of`, a review is required
  from every team (but if a person is a member of multiple teams, they can satisfy multiple
  requirements). When it's `any-of`, one review from any team is needed.

  Additionally, you can specify a single user by prefixing their username with `@`. For example,
  `@example` will be treated as a virtual team with one member; `example`.

Paths are matched using the [picomatch](https://www.npmjs.com/package/picomatch#globbing-features) library.

Every requirement object that applies must have appropriate reviews, it's not "first match". Thus,
using the example below, a PR touching file at docs/foo.css would need reviews satisfying both
the "Docs" and "Front end" review requirements. If you wanted to avoid that, you might add
`!**.css` to the first's paths or `!docs/**` to the second's.

### Example

```yaml
# Documentation must be reviewed by the documentation team.
- name: Docs
  paths:
   - 'docs/**'
  teams:
   - documentation

# Any CSS and React .jsx files must be reviewed by a front-end developer AND by a designer,
# OR by a member of the maintenance team.
- name: Front end
  paths:
   - '**.jsx'
   - '**.css'
  teams:
   - all-of:
      - front-end
      - design
   - maintenance

# All other files must be reviewed by the maintenance team.
- name: Misc
  paths: unmatched
  teams:
    - maintenance
```
