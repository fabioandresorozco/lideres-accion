import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class LocationService {
    private userLocation: { lat: number, lng: number } | null = null;
    private locationPromise: Promise<{ lat: number, lng: number }> | null = null;
    
    // Observable compartido para evitar múltiples watchers
    private locationObservable$: Observable<{ lat: number, lng: number }> | null = null;

    constructor() { }

    getUserLocation(): Promise<{ lat: number, lng: number }> {
        // If we already have the location, return it immediately
        if (this.userLocation) {
            return Promise.resolve(this.userLocation);
        }

        // If a request is already in progress, return the existing promise
        if (this.locationPromise) {
            return this.locationPromise;
        }

        // Otherwise, start a new request
        this.locationPromise = new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        this.locationPromise = null; // Clear the promise once resolved
                        resolve(this.userLocation);
                    },
                    (error) => {
                        console.error('Error getting location', error);
                        this.locationPromise = null; // Clear the promise on error
                        reject(error);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0 // We can adjust this if we want to accept slightly older cached positions from the browser itself
                    }
                );
            } else {
                this.locationPromise = null;
                reject(new Error('Geolocation not supported'));
            }
        });

        return this.locationPromise;
    }

    refreshLocation(): Promise<{ lat: number, lng: number }> {
        this.userLocation = null;
        this.locationPromise = null;
        return this.getUserLocation();
    }

    watchUserLocation(): Observable<{ lat: number, lng: number }> {
        if (!this.locationObservable$) {
            this.locationObservable$ = new Observable<{ lat: number, lng: number }>((observer) => {
                let watchId: number;

                if (navigator.geolocation) {
                    watchId = navigator.geolocation.watchPosition(
                        (position) => {
                            this.userLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };
                            observer.next(this.userLocation);
                        },
                        (error) => {
                            observer.error(error);
                        },
                        {
                            enableHighAccuracy: true,
                            timeout: 10000,
                            maximumAge: 0
                        }
                    );
                } else {
                    observer.error('Geolocation not supported');
                }

                return () => {
                    if (watchId !== undefined) {
                        navigator.geolocation.clearWatch(watchId);
                    }
                };
            }).pipe(
                shareReplay({ bufferSize: 1, refCount: false })
            );
        }
        return this.locationObservable$;
    }
}
