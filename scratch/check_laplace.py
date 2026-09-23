import numpy as np
from skimage.filters import threshold_otsu

def check():
    np.random.seed(42)
    # Lognormal fails both criteria
    data = np.random.lognormal(mean=0, sigma=1, size=100000)
    t = threshold_otsu(data)
    p = np.sum(data < t) / len(data)
    
    c1 = data[data < t]
    c2 = data[data >= t]
    mu1, s1 = np.mean(c1), np.std(c1)
    mu2, s2 = np.mean(c2), np.std(c2)
    d = np.sqrt(2) * np.abs(mu1 - mu2) / np.sqrt(s1**2 + s2**2)
    print(f"Lognormal(sigma=1): p={p}, D={d}")

check()
