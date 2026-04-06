# Copilot Ollama Proxy

A server that implements enough of Ollama's API on top of LM Studio API to allow Copilot chat to run.

## Overview

VSCode's Copilot Chat supports local models via Ollama, and depends on Ollama-specific APIs. Fortunately, it only uses them for model discovery, and uses OpenAI-compatible endpoints for actual requests. This app acts as a compatibility layer that translates Ollama model API calls for into LM Studio API calls, allowing you to use Copilot Chat with LM Studio.

### How It Works

The proxy server runs on `localhost:11434` (Ollama's default port) and forwards requests to LM Studio (default: `http://localhost:1234`). It handles:

- **Model listing** (`/api/tags`) - Lists loaded models from LM Studio (please note that it only lists loaded models, not all installed models. This is due to the fact that we don't know the effective context length before the model is loaded)
- **Model info** (`/api/show`) - Retrieves model metadata and capabilities (for loaded models only)
- **Version check** (`/api/version`) - This just returns Ollama version 0.0.0, causing Copilot Chat to skip the version check
- Proxies all other requests (e.g., `/v1/chat/completions`) to LM Studio with streaming support

Please note that is does not return all fields in the responses, only the ones Copilot Chat needs to show the models in the model picker.

## Environment Variables

Configure the behavior using the following environment variables:

| Variable              | Default Value           | Description                                                     |
| --------------------- | ----------------------- | --------------------------------------------------------------- |
| `COPRX_LISTEN_PORT`   | `11434`                 | Port for the proxy server to listen on (Ollama-compatible port) |
| `COPRX_LM_STUDIO_URL` | `http://localhost:1234` | URL of the LM Studio API endpoint                               |

### Example Usage

```bash
node coprx.js #Use with node

bun coprx.js #Use with bun

#Pass env vars to the app
COPRX_LISTEN_PORT=8080 COPRX_LM_STUDIO_URL=http://192.168.1.100:1234 node coprx.js
```

## Build Instructions

### Prerequisites

- Node.js 24+
- Either Yarn 4.13+ or Corepack

Please note that the project uses Yarn Zero-Installs

### Building the Project

Use make to build the projecy

```bash
make packinstall-safe #This installs all needed packages and verifies the cache

make #This builds the project into ./dist

```

Find the built files in ./dist:

- `coprx.js` - the production version (minified)
- `coprx.debug.js` - the debug version (not minified + has a source map)

Use `node --enable-source-maps dist/coprx.debug.js` if you want to have fancy error messages.
