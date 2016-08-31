# See more about this script here
# http://austinpray.com/ops/2015/09/20/change-travis-node-version.html

# Define a node version.
TRAVIS_NODE_VERSION="5"

# Clear out whatever version of NVM Travis has.
# Their version of NVM is probably old.
rm -rf ~/.nvm 
# Grab NVM.
git clone https://github.com/creationix/nvm.git ~/.nvm
# Checkout the latest stable tag.
(cd ~/.nvm && git checkout `git describe --abbrev=0 --tags`)
# Install the desired version of Node
source ~/.nvm/nvm.sh
nvm install $TRAVIS_NODE_VERSION
