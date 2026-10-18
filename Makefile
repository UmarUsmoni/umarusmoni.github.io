PYTHON ?= python3
IMAGE ?= umarusmoni-portfolio

.PHONY: test serve docker-build docker-test

test:
	$(PYTHON) -m pytest -q

serve:
	$(PYTHON) -m http.server 8000 --bind 127.0.0.1

docker-build:
	docker build --tag $(IMAGE) .

docker-test: docker-build
	docker run --rm --network=none $(IMAGE) python -m pytest -q
