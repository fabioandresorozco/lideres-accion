import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';

export interface RouteResponse {
  distance: number; // in meters
  duration: number; // in seconds
  geometry?: string; // polyline
}

@Injectable({
  providedIn: 'root'
})
export class RouteService {
  private readonly baseUrl = 'https://router.project-osrm.org/route/v1/driving';

  constructor(private http: HttpClient) { }

  getRoute(startLat: number, startLng: number, endLat: number, endLng: number): Observable<RouteResponse | null> {
    // OSRM expects {longitude},{latitude}
    const url = `${this.baseUrl}/${startLng},${startLat};${endLng},${endLat}?overview=false`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.code === 'Ok' && response.routes && response.routes.length > 0) {
          const route = response.routes[0];
          return {
            distance: route.distance,
            duration: route.duration,
            geometry: route.geometry
          };
        }
        return null;
      }),
      catchError(error => {
        console.error('Error fetching route:', error);
        return of(null);
      })
    );
  }
}
