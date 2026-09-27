import type { Map } from 'maplibre-gl';

export class FlyIn {
  private map: Map;
  private skipped: boolean = false;
  private bounds: [number, number, number, number];

  constructor(map: Map, bounds: [number, number, number, number]) {
    this.map = map;
    this.bounds = bounds;
  }

  start() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      this.jumpToTarget();
      return;
    }

    const abortFly = () => {
      this.skipped = true;
      this.map.off('mousedown', abortFly);
      this.map.off('touchstart', abortFly);
      this.map.off('wheel', abortFly);
      this.map.stop();
      this.jumpToTarget();
    };

    this.map.once('mousedown', abortFly);
    this.map.once('touchstart', abortFly);
    this.map.once('wheel', abortFly);

    // Initial zoom out to Earth
    this.map.flyTo({
      center: [89.7, 24.5],
      zoom: 1,
      duration: 1000
    });

    setTimeout(() => {
      if (this.skipped) return;
      // Fly into Bangladesh
      this.map.flyTo({
        center: [89.7, 24.5],
        zoom: 6,
        duration: 2000
      });

      setTimeout(() => {
        if (this.skipped) return;
        // Fit to Reach bounds without padding
        this.map.fitBounds(this.bounds, { padding: 0, duration: 2000 });
        
        setTimeout(() => {
          if (this.skipped) return;
          // Zoom in a bit more to hide the sides and make it full screen
          this.map.zoomTo(this.map.getZoom() + 2.5, { duration: 1500 });
          setTimeout(() => {
            this.map.off('mousedown', abortFly);
            this.map.off('touchstart', abortFly);
            this.map.off('wheel', abortFly);
          }, 1500);
        }, 2200);
      }, 2000);
    }, 1000);
  }

  private jumpToTarget() {
    this.map.fitBounds(this.bounds, { padding: 0, animate: false });
    this.map.setZoom(this.map.getZoom() + 2.5);
  }
}
