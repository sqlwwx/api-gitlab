LINT = $(PWD)/node_modules/.bin/eslint
JEST = $(PWD)/node_modules/.bin/jest
BABEL = $(PWD)/node_modules/.bin/babel
FORMATTER = $(shell node -p "require.resolve('eslint-friendly-formatter')")

DIR ?= src

install:
	yarn install
	yarn global add jsinspect
	yarn add axios emoji-regex fast-xml-parser file-box he jimp jsqr qrcode bcrypt jsonwebtoken lodash --peer

build:
	NODE_ENV=production $(BABEL) src -d . --copy-files

watch:
	$(BABEL) -w src -d . --copy-files

lint:
	$(LINT) --format $(FORMATTER) --fix src/*.js

test: lint
	$(JEST) --env=node --coverage --runInBand $(DIR)

dev:
	$(JEST) -o --watch --runInBand --forceExit $(DIR)

publish: build
	npm publish

.PHONY: test lint dev build watch publish install
