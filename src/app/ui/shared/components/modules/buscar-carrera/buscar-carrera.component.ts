import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IconButtonComponent } from '../../atoms/icon-button/icon-button.component';
import { IconWhatsappComponent } from '../../atoms/icon-whatsapp/icon-whatsapp.component';
import { CreateCarreraModel, PostuladosIdsModel } from '../../../../../models/carrera/carrera.model';
import { CarreraService } from '../../../services/carrera/carrera.service';
import { AuthService } from '../../../services/auth/auth.service';
import { VehiculoService } from '../../../services/vehiculo/vehiculo.service';
import { VehiculoModel } from '../../../../../models/vehiculo/vehiculo.model';
import { firstValueFrom, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DialogNotificationComponent } from '../../../dialogs/dialog-notification/dialog-nofication.component';
import { LocationService } from '../../../services/location/location.service';
import { RouteService } from '../../services/route/route.service';

// Local interface to extend model with display properties without modifying global model
interface CarreraWithDistance extends CreateCarreraModel {
    distancia?: string;
    tiempoEstimado?: number;
    distanciaRuta?: string;
    tiempoRuta?: number;
}

import { MatChipsModule } from '@angular/material/chips';
import { PerfilModel } from '../../../../../models/perfil/perfil.model';

@Component({
    selector: 'app-buscar-carrera',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatChipsModule,
        IconButtonComponent,
        IconWhatsappComponent
    ],
    templateUrl: './buscar-carrera.component.html',
    styleUrls: ['./buscar-carrera.component.scss']
})
export class BuscarCarreraComponent implements OnInit, OnDestroy {
    private destroy$ = new Subject<void>();
    private carrerasSub: Subscription | null = null;
    carrerasDisponibles: CarreraWithDistance[] = [];
    loadingBuscar: boolean = false;
    vehiculoActivo: VehiculoModel | null = null;
    vehiculoMensaje: string = '';
    userLocation: { lat: number, lng: number } | null = null;
    usuario: PerfilModel = JSON.parse(localStorage.getItem('usuario') || '{}');


    constructor(
        private carreraService: CarreraService,
        private authService: AuthService,
        private vehiculoService: VehiculoService,
        private dialog: MatDialog,
        private locationService: LocationService,
        private routeService: RouteService
    ) { }

    ngOnInit(): void {
        this.getLocation();
        this.checkVehiculoAndLoadDisponibles();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
        this.carrerasSub?.unsubscribe();
    }

    async getLocation() {
        try {
            this.userLocation = await this.locationService.getUserLocation();
            if (this.carrerasDisponibles.length > 0) {
                this.calculateDistances();
            }
        } catch (error: any) {
            let message = 'No se pudo obtener tu ubicación.';
            if (error.code === 1) {
                message = 'Permiso denegado. Por favor habilita la ubicación en tu navegador.';
            } else if (error.code === 2) {
                message = 'Tu ubicación no está disponible actualmente.';
            } else if (error.code === 3) {
                message = 'Se agotó el tiempo para obtener tu ubicación.';
            }
            // Don't show error dialog if it's just a timeout/unavailable, maybe?
            // Keeping original behavior of showing dialog for errors.
            this.dialog.open(DialogNotificationComponent, {
                width: '400px',
                data: {
                    title: 'Error de Ubicación',
                    message: message,
                    type: 'error',
                    bottons: 'one'
                }
            });
        }
    }

    availableTypes: Set<string> = new Set();
    selectedTypes: string[] = [];
    showFilter: boolean = false;

    async checkVehiculoAndLoadDisponibles() {
        this.loadingBuscar = true;
        const uid = this.authService.uidUser();

        if (!uid) {
            this.vehiculoMensaje = 'Debes iniciar sesión para buscar carreras.';
            this.loadingBuscar = false;
            return;
        }

        try {
            // Get ALL vehicles for the user (not just limit 1, though service returns array)
            const vehiculos = await firstValueFrom(this.vehiculoService.getVehiculoByConductor(uid));

            if (vehiculos && vehiculos.length > 0) {
                // Filter for approved and active vehicles
                const activeVehiculos = vehiculos.filter(v => v.aprobado && v.estado === 'Activo');

                if (activeVehiculos.length > 0) {
                    // Set primary vehicle as the first active one for postulation logic (or handle selection later)
                    this.vehiculoActivo = activeVehiculos[0];

                    // Collect all vehicle types
                    activeVehiculos.forEach(v => this.availableTypes.add(v.tipoVehiculo));

                    // Business Rule: If user has 'Camioneta', they can also see 'Carro'
                    if (this.availableTypes.has('Camioneta')) {
                        this.availableTypes.add('Carro');
                        this.showFilter = true; // Only show filter if Camioneta is present
                    } else {
                        this.showFilter = false;
                    }

                    // Select all available types by default
                    this.selectedTypes = Array.from(this.availableTypes);
                    this.loadCarrerasDisponibles(this.selectedTypes);
                } else {
                    this.vehiculoMensaje = 'Tus vehículos no están aprobados o no están en estado "Activo".';
                }
            } else {
                this.vehiculoMensaje = 'No tienes un vehículo registrado para tomar carreras.';
            }
        } catch (error) {
            console.error('Error checking vehicle', error);
            this.vehiculoMensaje = 'Error al verificar información del vehículo.';
        } finally {
            this.loadingBuscar = false;
        }
    }

    loadCarrerasDisponibles(tiposVehiculo: string | string[]) {
        const uid = this.authService.uidUser();
        // Check if types array is empty to avoid unnecessary calls or errors
        if (Array.isArray(tiposVehiculo) && tiposVehiculo.length === 0) {
            this.carrerasDisponibles = [];
            return;
        }

        // Always cancel the previous listener before creating a new one
        this.carrerasSub?.unsubscribe();
        this.carrerasSub = this.carreraService.getCarrerasDisponibles(tiposVehiculo, this.usuario.iglesia?.municipio || '')
            .pipe(takeUntil(this.destroy$))
            .subscribe(carreras => {
                // Filter out races created by me
                this.carrerasDisponibles = carreras.filter(c => c.creadaPor !== uid);

                if (this.userLocation) {
                    this.calculateDistances();
                }
            });
    }

    toggleType(type: string) {
        if (this.selectedTypes.includes(type)) {
            // Don't allow deselecting the last one if you want? Or maybe allow empty state.
            this.selectedTypes = this.selectedTypes.filter(t => t !== type);
        } else {
            this.selectedTypes.push(type);
        }
        this.loadCarrerasDisponibles(this.selectedTypes);
    }

    calculateDistances() {
        if (!this.userLocation) return;

        this.carrerasDisponibles = this.carrerasDisponibles.map(carrera => {
            if (carrera.latitudSolicitante && carrera.longitudSolicitante) {
                const dist = this.getDistanceFromLatLonInKm(
                    this.userLocation!.lat,
                    this.userLocation!.lng,
                    carrera.latitudSolicitante,
                    carrera.longitudSolicitante
                ) * 3.5;
                const timeHours = dist / 30;
                const timeMinutes = Math.round(timeHours * 60 * 2.5);

                return {
                    ...carrera,
                    distancia: dist.toFixed(1),
                    tiempoEstimado: timeMinutes
                } as CarreraWithDistance;
            }
            return carrera;
        });

        this.carrerasDisponibles.sort((a, b) => {
            if (a.distancia && b.distancia) return Number(a.distancia) - Number(b.distancia);
            return 0;
        });

        this.calculateRouteDistances();
    }

    async calculateRouteDistances() {
        if (!this.userLocation) return;

        // Process one by one to minimalize server load (or use Promise.all for parallel)
        // Using Promise.all for better UX but be aware of rate limits
        const promises = this.carrerasDisponibles.map(async (carrera) => {
            if (carrera.latitudSolicitante && carrera.longitudSolicitante) {
                try {
                    const route = await firstValueFrom(this.routeService.getRoute(
                        this.userLocation!.lat,
                        this.userLocation!.lng,
                        carrera.latitudSolicitante,
                        carrera.longitudSolicitante
                    ));

                    if (route) {
                        carrera.distanciaRuta = (route.distance / 1000).toFixed(1); // meters to km
                        carrera.tiempoRuta = Math.round(route.duration / 60); // seconds to minutes
                    }
                } catch (e) {
                    console.error('Error calculating route distance', e);
                }
            }
        });

        await Promise.all(promises);
    }

    isPostulated(carrera: CreateCarreraModel): boolean {
        if (!this.vehiculoActivo || !this.vehiculoActivo.id) return false;
        return carrera.postulados?.some(p => p.id === this.vehiculoActivo?.id) || false;
    }

    async togglePostulacion(carrera: CreateCarreraModel) {
        if (this.isPostulated(carrera)) {
            await this.cancelarPostulacion(carrera);
        } else {
            await this.postularse(carrera);
        }
    }

    async cancelarPostulacion(carrera: CreateCarreraModel) {
        if (!this.vehiculoActivo || !this.vehiculoActivo.id) return;

        // Find the specific postulation object to remove
        const postulacionToRemove = carrera.postulados?.find(p => p.id === this.vehiculoActivo?.id);

        if (!postulacionToRemove) return;

        try {
            await this.carreraService.cancelarPostulacion(carrera.id!, postulacionToRemove);
            this.dialog.open(DialogNotificationComponent, {
                width: '400px',
                data: {
                    title: 'Postulación Cancelada',
                    message: 'Has eliminado tu postulación correctamente.',
                    type: 'success',
                    bottons: 'one'
                }
            });
        } catch (error) {
            console.error('Error al cancelar postulación', error);
            this.dialog.open(DialogNotificationComponent, {
                width: '400px',
                data: {
                    title: 'Error',
                    message: 'Hubo un problema al cancelar la postulación.',
                    type: 'error',
                    bottons: 'one'
                }
            });
        }
    }

    get hasActivePostulation(): boolean {
        return this.carrerasDisponibles.some(c => this.isPostulated(c));
    }

    async postularse(carrera: CreateCarreraModel) {
        if (!this.vehiculoActivo || !this.vehiculoActivo.id) return;

        if (this.hasActivePostulation) {
            this.dialog.open(DialogNotificationComponent, {
                width: '400px',
                data: {
                    title: 'Ya tienes una postulación',
                    message: 'Solo puedes postularte a una carrera a la vez. Cancela tu postulación actual para aplicar a otra.',
                    type: 'error',
                    bottons: 'one'
                }
            });
            return;
        }

        if (!this.userLocation) {
            alert('Necesitamos tu ubicación para postularte.');
            return;
        }

        const postulacion: PostuladosIdsModel = {
            id: this.vehiculoActivo.id,
            latitud: this.userLocation.lat,
            longitud: this.userLocation.lng
        };

        try {
            await this.carreraService.postularse(carrera.id!, postulacion);
            this.dialog.open(DialogNotificationComponent, {
                width: '400px',
                data: {
                    title: '¡Exitoso!',
                    message: 'Te has postulado correctamente a la carrera.',
                    type: 'success',
                    bottons: 'one'
                }
            });
        } catch (error) {
            console.error('Error al postularse', error);
            this.dialog.open(DialogNotificationComponent, {
                width: '400px',
                data: {
                    title: 'Error',
                    message: 'Hubo un problema al postularse. Inténtalo de nuevo.',
                    type: 'error',
                    bottons: 'one'
                }
            });
        }
    }

    getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        var R = 6371;
        var dLat = this.deg2rad(lat2 - lat1);
        var dLon = this.deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d;
    }

    deg2rad(deg: number) {
        return deg * (Math.PI / 180);
    }

    getWhatsAppLink(telefono: string): string {
        return `https://wa.me/${telefono}`;
    }
}
