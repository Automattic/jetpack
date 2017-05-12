NAME					:= wpcomsh
SHELL 				:= /bin/bash
UNAME 				:= $(shell uname -s)
REQUIRED_BINS := zip git rsync composer

## check required bins can be found in $PATH
$(foreach bin,$(REQUIRED_BINS),\
	$(if $(shell command -v $(bin) 2> /dev/null),, $(error `$(bin)` not found in $$PATH)))

## handle version info from git tags
ifeq ($(shell git describe --tags > /dev/null 2>&1 ; echo $$?), 0)
	VERSION := $(shell git describe --tags --long --always \
		| sed 's/v\([0-9]*\)\.\([0-9]*\)\.\([0-9]*\)-\?.*-\([0-9]*\)-\(.*\)/\1 \2 \3 \4 \5/g')
	VERSION_MAJOR := $(word 1, $(VERSION))
	VERSION_MINOR := $(word 2, $(VERSION))
	VERSION_POINT := $(word 3, $(VERSION))
	VERSION_REVISION := $(word 4, $(VERSION))
	VERSION_HASH := $(word 5, $(VERSION))
	VERSION_STRING := \
		$(VERSION_MAJOR).$(VERSION_MINOR).$(VERSION_POINT)
endif

## set paths from the location of the makefile
MAKEFILE   := $(abspath $(lastword $(MAKEFILE_LIST)))
BUILD_SRC  := $(dir $(MAKEFILE))
BUILD_DST  := $(addsuffix build, $(dir $(MAKEFILE)))
BUILD_FILE := $(NAME)-$(VERSION_STRING).zip

## git related vars
GIT_BRANCH = $(shell git rev-parse --abbrev-ref HEAD)
GIT_REMOTE_FULL = $(shell git for-each-ref --format='%(upstream:short)' $$(git symbolic-ref -q HEAD))
GIT_REMOTE_NAME = $(firstword $(subst /, , $(GIT_REMOTE_FULL)))
GIT_STATUS = $(shell git status -sb --untracked=no | wc -l | awk '{ if($$1 == 1){ print "clean" } else { print "dirty" } }')

## checking for clean tree and all changes pushed/pulled
git.fetch:
	@git fetch $(GIT_REMOTE_NAME)

check: git.fetch
ifneq ($(GIT_STATUS), clean)
	$(error un-committed changes detected in working tree)
endif

ifneq ($(strip $(shell git diff --exit-code --quiet $(GIT_REMOTE_FULL)..HEAD 2>/dev/null ; echo $$?)), 0)
	$(error local branch not in sync with remote, need to git push/pull)
endif

$(BUILD_DST)/$(BUILD_FILE): $(BUILD_DST)/$(NAME)
	@ echo "fetching submodules..."
	@ git submodule update --init --recursive &>/dev/null

	@ echo "running composer install..."
	@ composer install &>/dev/null

	@ echo "rsync'ing to build dir..."
	@ rsync \
    --quiet \
    --links \
    --recursive \
    --times \
    --perms \
    --exclude-from=$(BUILD_SRC)build-exclude.txt \
    $(BUILD_SRC) \
    $(BUILD_DST)/$(NAME)/

	@ echo "creating zip file..."
	@ cd $(BUILD_DST) && zip -q -r $(BUILD_FILE) $(NAME)/ -x "._*"

	@ echo "DONE!"

$(BUILD_DST)/$(NAME): $(BUILD_DST)
	@ mkdir -p $(BUILD_DST)/$(NAME)

$(BUILD_DST):
	@ mkdir -p $(BUILD_DST)

## build
build: $(BUILD_DST)/$(BUILD_FILE)

## release
release: export RELEASE_BUCKET := pressable-misc
release: build
	$(if $(shell command -v s3cmd 2> /dev/null),, $(error `s3cmd` not found in $$PATH))
	@ echo "uploading to s3 $(RELEASE_BUCKET)..."
	@ s3cmd put --acl-public --guess-mime-type \
      $(BUILD_DST)/$(BUILD_FILE) s3://$(RELEASE_BUCKET) &>/dev/null
	@ echo "DONE!"

## clean
clean: $(BUILD_DST)
	@ echo "removing $(BUILD_DST)"
	@ rm -rf $(BUILD_DST)

.PHONY: check git.fetch submodules release clean test
