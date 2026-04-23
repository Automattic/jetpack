FROM php:8.4-cli-bookworm

USER root

RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    xz-utils \
    ca-certificates \
    tmux \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Install Node 24
RUN ARCH="$(dpkg --print-architecture)" && \
    case "$ARCH" in \
      amd64) NODE_ARCH="x64" ;; \
      arm64) NODE_ARCH="arm64" ;; \
      *) echo "Unsupported arch: $ARCH" && exit 1 ;; \
    esac && \
    curl -fsSLO "https://nodejs.org/download/release/v24.14.1/node-v24.14.1-linux-${NODE_ARCH}.tar.gz" && \
    curl -fsSLO "https://nodejs.org/download/release/v24.14.1/SHASUMS256.txt" && \
    grep "node-v24.14.1-linux-${NODE_ARCH}.tar.gz" SHASUMS256.txt | sha256sum -c - && \
    mkdir -p /usr/local/lib/nodejs && \
    tar -xzf "node-v24.14.1-linux-${NODE_ARCH}.tar.gz" -C /usr/local/lib/nodejs --strip-components=1 && \
    rm "node-v24.14.1-linux-${NODE_ARCH}.tar.gz" SHASUMS256.txt

ENV PATH="/usr/local/lib/nodejs/bin:${PATH}"

RUN npm install -g pnpm@10.28.2 @anthropic-ai/claude-code@2.1.118

# Install Composer 2.9.2
RUN curl -fsSL https://getcomposer.org/installer -o composer-setup.php && \
    EXPECTED=$(curl -fsSL https://composer.github.io/installer.sig) && \
    ACTUAL=$(php -r "echo hash_file('sha384', 'composer-setup.php');") && \
    if [ "$EXPECTED" != "$ACTUAL" ]; then echo "Composer installer checksum mismatch" && rm composer-setup.php && exit 1; fi && \
    php composer-setup.php --version=2.9.2 --install-dir=/usr/local/bin --filename=composer && \
    rm composer-setup.php

RUN useradd -ms /bin/bash dev && \
    mkdir -p /home/dev/jetpack/node_modules && \
    chown -R dev:dev /home/dev/jetpack

USER dev
WORKDIR /home/dev/jetpack
RUN git config --global core.hooksPath /home/dev/jetpack/tools/ai-sandbox/hooks