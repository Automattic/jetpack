# Jetpack JS Tools

The standard `node_modules` JavaScript dependency system automatically allows
any subdirectory to access modules installed in a parent directory, which in
the case of the monorepo can lead to projects having hidden dependencies that
are declared at the monorepo level.

The solution is to put everything in a project, so the monorepo depends on as
little as possible. This is the "miscellaneous" project used to hold all the
things that are too small and specialized to be worth creating a separate
project for, and to depend on third-party tools so only the binaries can be
exposed at the monorepo level.

## Scripts

Scripts here are generally single-file command line tools to accomplish a
single task related to repo management, release, or CI.

## Stubs

Three-line bash stubs are used to expose the third-party tools at the monorepo
level, without allowing those tools to be depended on otherwise. For example,
this allows use of the `semver` CLI command without letting projects have an
undeclared dependency on the `semver` JS module.
