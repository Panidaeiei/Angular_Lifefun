// src/types/leaflet.d.ts

import * as L from 'leaflet';

declare module 'leaflet' {
  namespace Control {
    class Geocoder {
      static geocoder(options?: any): any;
      static nominatim(options?: any): any;
    }
  }
}
