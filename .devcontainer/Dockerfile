FROM node:20-bookworm

# Install useful development tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    htop \
    && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN corepack enable && corepack prepare pnpm@latest --activate

# Create non-root user
ARG USERNAME=node
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Set working directory
WORKDIR /workspace

# Expose Vite dev server port
EXPOSE 5173

# Default command
CMD ["sleep", "infinity"]
