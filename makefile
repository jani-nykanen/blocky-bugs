.PHONY: js
js:
	mkdir -p js
	tsc src/core/*.ts src/*.ts --module es2020 --lib es2020,dom --target es2020 --outDir js

.PHONY: core
core:
	mkdir -p js
	mkdir -p js/core
	tsc src/core/*.ts --module es2020 --lib es2020,dom --target es2020 --outDir js/core

.PHONY:
game:
	mkdir -p js
	tsc src/*.ts --module es2020 --lib es2020,dom --target es2020 --outDir js


server:
	python3 -m http.server

linecount:
	(cd src; find . -name '*.ts' | xargs wc -l)

	
dist:
	zip -r dist.zip js
	zip -r dist.zip assets
	zip -r dist.zip index.html

