PATH := ./node_modules/.bin:${PATH}

.PHONY : init clean build dist publish watch

init:
	npm install

clean:
	rm -rf lib/ node_modules/

build:
	coffee -o lib/ -c src/

watch:
	coffee -o lib/ -c -w src/

dist: clean init build

publish: dist
	npm publish