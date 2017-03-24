NAME					:= wpcomsh
SHELL 				:= /bin/bash
UNAME 				:= $(shell uname -s)
REQUIRED_BINS := zip git rsync

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

## get files to include in the build
SOURCE_FILES := $(shell git ls-files --cached --recurse-submodules --no-empty-directory | grep -vE "^(\.git|Makefile|\.md)$$")

## set paths from the location of the makefile
MAKEFILE   = $(word $(words $(MAKEFILE_LIST)),$(MAKEFILE_LIST))
BUILD_PATH = $(shell cd $(shell dirname $(MAKEFILE)); pwd)/build
BUILD_FILE = $(NAME)-$(VERSION_STRING).zip

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

## build
build: check $(BUILD_PATH)/$(BUILD_FILE)

$(BUILD_PATH):
	@echo "===== creating '$(BUILD_PATH)' directory ====="
	mkdir -p $(BUILD_PATH)

$(BUILD_PATH)/$(NAME): $(BUILD_PATH)
	@echo "===== creating $(BUILD_PATH)/$(NAME) directory ====="
	mkdir -p $(BUILD_PATH)/$(NAME)

	@echo "===== rsync source files to $(BUILD_PATH)/$(NAME) ====="
	rsync -lrRtp --itemize-changes $(SOURCE_FILES) $(BUILD_PATH)/$(NAME)/

$(BUILD_PATH)/$(BUILD_FILE): $(BUILD_PATH)/$(NAME)
	@echo "===== getting submodules ====="
	git submodule update --init --recursive

	@echo "===== creating '$(BUILD_PATH)/$(BUILD_FILE)' ====="
	cd $(BUILD_PATH) && \
    zip -r $(BUILD_PATH)/$(BUILD_FILE) $(NAME)/

## release
release: export RELEASE_BUCKET := pressable-misc
release: build
	@echo "===== uploading to s3 ====="
	$(if $(shell command -v s3cmd 2> /dev/null),, $(error `s3cmd` not found in $$PATH))
	s3cmd put --acl-public --guess-mime-type \
		$(BUILD_PATH)/$(BUILD_FILE) s3://$(RELEASE_BUCKET)

## clean
clean:
	@echo "===== removing '$(BUILD_PATH)' ====="
	rm -rf $(BUILD_PATH)

.PHONY: check git.fetch submodules release clean
