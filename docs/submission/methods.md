# Methods

The Antigravity River Sentinel uses NASA's NISAR L2 GCOV provisional data to map riverbank erosion and accretion in the Jamuna river. We developed an automated Python pipeline that acquires, preprocesses, and analyzes SAR imagery to classify water using a statistically robust Otsu thresholding method combined with Ashman's D for bimodal verification.

We pair radar acquisitions with in-situ water level data from the Flood Forecasting and Warning Centre (FFWC) to ensure that we are comparing riverbanks at identical river stages, removing the ambiguity between actual land loss and temporary flooding. The results are presented in a highly responsive React/MapLibre web interface, engineered to be accessible in low-bandwidth environments.

Our approach integrates CEGIS long-term forecasts and OPERA DSWx validation data, adhering strictly to a zero-AI and full-provenance methodology as outlined in our project specifications.
