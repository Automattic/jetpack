When performing a code review, ensure that the code adheres to the project's coding standards and guidelines as outlined in `/docs/coding-guidelines.md` file.

When performing a code review, look for issues such as inconsistent naming conventions, typos, missing documentation for public APIs, missing explanations for complex or non-obvious logic, and inefficient algorithms. Provide constructive feedback and suggest improvements where necessary.

When performing a code review of style (CSS/SCSS) files, suggest using logical properties instead of physical direction and dimension mappings to make CSS RTL-aware by default. When commenting, you can link to this resource: <https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Logical_Properties>

Don't suggest replacing or modifying any "$$next-version$$" placeholders (for example in tags like "@since $$next-version$$", "@deprecated $$next-version$$", "@deprecated since $$next-version$$", or in `_deprecated_function()` strings such as 'package-$$next-version$$'). These placeholders are intentionally used and will be replaced during the release process.

- Remember that we have a custom changelog management system. Every PR touching `/projects` needs a changelog file created via `jetpack changelog add`. When reviewing changelog entries, ensure that they:
  - Are grammatically correct and free of typos.
  - Start with a capital letter and end with a period.
  - Use an imperative mood (e.g., use "Add feature." instead of "Added feature" or "Adds feature").
  - Use a component/feature prefix when the change is specific to a component/feature within the project (e.g., "Connection: Fix timeout issue with site registration.").
  - Do not use the package/project name as a prefix for entries in that same package (e.g., for entries in `projects/packages/forms/`, do not use a `Forms:` prefix).
  - Describe the change from a user's perspective, not the implementation details.
