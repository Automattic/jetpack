set errexit
set nounset

echo 'Benchmarking install, already installed…'
hyperfine \
  --export-markdown 'installed.md' \
  --warmup 1 \
  --cleanup 'git checkout -- .yarnrc.yml yarn.lock yarn2.lock package.json' \
  --prepare ':' \
  --command-name 'Yarn 2' \
  'yarn install' \
  --prepare 'rm -fr .yarnrc.yml; git checkout -- package.json' \
  --command-name 'Yarn 1' \
  'yarn install'
echo
echo
echo

echo 'Benchmarking install, hot cache…'
hyperfine \
  --export-markdown 'hot.md' \
  --warmup 1 \
  --cleanup 'git checkout -- .yarnrc.yml yarn.lock yarn2.lock package.json' \
  --prepare 'rm -fr node_modules' \
  --command-name 'Yarn 2' \
  'yarn install' \
  --prepare 'rm -fr .yarnrc.yml node_modules; git checkout -- package.json' \
  --command-name 'Yarn 1' \
  'yarn install'
echo
echo
echo

echo 'Benchmarking install, no lock…'
hyperfine \
  --export-markdown 'no-lock.md' \
  --cleanup 'git checkout -- .yarnrc.yml yarn.lock yarn2.lock package.json' \
  --command-name 'Yarn 2' \
  --prepare 'rm -fr node_modules yarn.lock yarn2.lock' \
  'yarn install' \
  --prepare 'rm -fr .yarnrc.yml node_modules yarn.lock yarn2.lock; git checkout -- package.json' \
  --command-name 'Yarn 1' \
  'yarn install'
echo
echo
echo

echo 'Benchmarking install, cold cache…'
hyperfine \
  --export-markdown 'cold.md' \
  --cleanup 'git checkout -- .yarnrc.yml yarn.lock yarn2.lock package.json' \
  --prepare 'yarn cache clean --all; rm -fr node_modules' \
  --command-name 'Yarn 2' \
  'yarn install' \
  --prepare 'yarn cache clean; rm -fr node_modules .yarnrc.yml ; git checkout -- package.json' \
  --command-name 'Yarn 1' \
  'yarn install'
echo
echo
echo

say 'Benchmarking completed'
