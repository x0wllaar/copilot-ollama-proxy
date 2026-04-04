.PHONY = clean generator clean-all packinstall packinstall-safe website

YARN_COMMAND = $(shell ./shell-scripts/find-yarn.sh)
$(if $(YARN_COMMAND),,$(error internal shell script ./shell-scripts/find-yarn.sh failed))

dist: dist/coprx.debug.js dist/coprx.js

build/js-build: $(shell find src -type f)
	rm -r build/js-build || true
	$(YARN_COMMAND) tsc

dist/coprx.debug.js: build/js-build
	$(YARN_COMMAND) esbuild build/js-build/_start.mjs --bundle --platform=node --target=node10 --sourcemap="inline" --outfile=dist/coprx.debug.js

dist/coprx.js: build/js-build
	$(YARN_COMMAND) esbuild build/js-build/_start.mjs --bundle --minify --platform=node --target=node10 --outfile=dist/coprx.js

clean:
	rm -r build || true
	rm -r dist || true

packinstall:
	$(YARN_COMMAND) install --immutable --immutable-cache

packinstall-safe:
	$(YARN_COMMAND) install --immutable --immutable-cache --check-cache