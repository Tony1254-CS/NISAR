.PHONY: discover

discover:
ifndef REACH
	$(error REACH is not set. Usage: make discover REACH=jamuna-chilmari)
endif
	python src/pipeline/discover.py --reach $(REACH)
