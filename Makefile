.PHONY: discover

discover:
ifndef REACH
	$(error REACH is not set. Usage: make discover REACH=jamuna-chilmari)
endif
	python src/pipeline/discover.py --reach $(REACH)

.PHONY: fetch

fetch:
ifndef REACH
	$(error REACH is not set. Usage: make fetch REACH=jamuna-chilmari)
endif
	python src/pipeline/fetch.py --reach $(REACH)

.PHONY: fetch-dswx

fetch-dswx:
ifndef REACH
	$(error REACH is not set. Usage: make fetch-dswx REACH=jamuna-chilmari)
endif
	python src/pipeline/io_dswx.py --reach $(REACH)

.PHONY: fetch-hand

fetch-hand:
ifndef REACH
	$(error REACH is not set. Usage: make fetch-hand REACH=jamuna-chilmari)
endif
	python src/pipeline/io_hand.py --reach $(REACH)
