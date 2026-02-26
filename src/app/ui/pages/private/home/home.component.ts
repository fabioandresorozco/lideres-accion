import { IglesiaService } from '../../../shared/services/iglesia/iglesia.service';
import { IglesiaModel } from './../../../../models/iglesia/iglesia.model';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { NAME_LONG_APP } from '../../../shared/const/name-app.const';
import { PerfilModel } from '../../../../models/perfil/perfil.model';
import { PerfilService } from '../../../shared/services/perfil/perfil.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { SkeletonComponent } from '../../../shared/components/organism/skeleton/skeleton.component';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DialogNotificationComponent } from '../../../shared/dialogs/dialog-notification/dialog-nofication.component';
import { ContainerAlertInformationComponent } from '../../../shared/components/modules/container-alert-information/container-alert-information.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { VehiculoService } from '../../../shared/services/vehiculo/vehiculo.service';
import { CasaApoyoService } from '../../../shared/services/casa-apoyo/casa-apoyo.service';
import { VehiculoModel } from '../../../../models/vehiculo/vehiculo.model';
import { MatExpansionModule } from '@angular/material/expansion';
import { TestigoAsociadoService } from '../../../shared/services/testigo-asociado/testigo-asociado.service';
import { BaseModel } from '../../../../models/base/base.model';
import { DialogCrearCarreraComponent } from '../../../shared/dialogs/dialog-crear-carrera/dialog-crear-carrera.component';
import { PostulacionCardComponent } from '../../../shared/components/cards/postulacion-card/postulacion-card.component';
import { TestigoModel } from '../../../../models/testigo/testigo.model';
import { PuestoVotacionService } from '../../../shared/services/puesto-votacion/puesto-votacion.service';
import { EnviarResultadosVotacionComponent } from '../enviar-resultados-votacion/enviar-resultados-votacion.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    SkeletonComponent,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    ContainerAlertInformationComponent,
    MatExpansionModule,
    MatExpansionModule,
    MatExpansionModule,
    PostulacionCardComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  skeleton: boolean = true;
  nameLong: string = NAME_LONG_APP;
  usuario: PerfilModel = JSON.parse(localStorage.getItem('usuario') || '{}');
  showInfoPerfil: boolean = true;
  userPhotoUrl: string | null = null;

  // Status flags
  vehiculoStatus: string | null = null;
  casaApoyoStatus: string | null = null;
  testigoStatus: string | null = null;

  // Data
  casaApoyoVehiculos: VehiculoModel[] = [];
  userLocation: { lat: number, lng: number } | null = null;

  get isProfileIncomplete(): boolean {
    return !this.usuario.nombres || !this.usuario.apellidos;
  }

  get isChurchMissing(): boolean {
    return !this.isProfileIncomplete && !this.usuario.iglesia;
  }

  constructor(
    private readonly IglesiaService: IglesiaService,
    private readonly perfilService: PerfilService,
    private readonly auth: AuthService,
    public dialog: MatDialog,
    private readonly vehiculoService: VehiculoService,
    private readonly casaApoyoService: CasaApoyoService,
    private readonly testigoAsociadoService: TestigoAsociadoService,
    private readonly puestoVotacionService: PuestoVotacionService,
    private readonly router: Router
  ) { }

  ngOnInit(): void {
    setTimeout(() => {
      this.showInfoPerfil = false;
    }, 5000);
    this.getUserLocation();
    const usuarioData = localStorage.getItem('usuario');
    if (usuarioData) {
      this.usuario = JSON.parse(usuarioData);
      this.perfilService.setCurrentUser(this.usuario); // Notify subscribers

      // Background update (Silent refresh)
      this.updateUserDataInBackground();

      this.loadPostulacionesInfo();
      this.userPhotoUrl = this.auth.getPhotoUrl();
      this.skeleton = false;
    } else {
      this.getusuario(this.auth.uidUser());
    }
  }

  async updateUserDataInBackground() {
    try {
      const uid = this.auth.uidUser();
      if (!uid) return;

      const latestUser = await this.perfilService.getMiPerfil(uid);
      if (latestUser) {
        // Update local state
        this.usuario = latestUser;
        // Update storage
        localStorage.setItem(
          'usuario',
          JSON.stringify({ ...this.usuario, id: uid })
        );
        // Notify app
        this.perfilService.setCurrentUser(this.usuario);

        // Update photo if changed
        if (this.usuario.foto) {
          this.userPhotoUrl = this.usuario.foto;
        }
      }
    } catch (error) {
      console.warn('Background update failed silently', error);
      // We don't show error to user because they are using cached version happily
    }
  }

  async getusuario(id: string) {
    try {
      this.usuario = await this.perfilService.getMiPerfil(id);
      localStorage.setItem(
        'usuario',
        JSON.stringify({ ...this.usuario, id: id })
      );
      this.perfilService.setCurrentUser(this.usuario); // Es un control de estados global
      if (this.usuario.iglesia) {
        // Esta linea se puede eliminar o borrar .... mas adelante se borrara y se tomara solo el id de la iglesia desde el usuario de local storage
      } else {
        this.openDialogMissingChurch();
      }
      this.loadPostulacionesInfo();
      this.userPhotoUrl = this.auth.getPhotoUrl();
      this.skeleton = false;
    } catch (error) {
      console.error(error);
      this.skeleton = false;
      this.openDialogNotification()
    }
  }

  // Details info
  testigoInfo: { puesto: string, mesa: string } | null = null;
  vehiculoInfo: { casaApoyo: string; direccion?: string; barrio?: string; responsableTelefono?: string } | null = null;
  misTestigos: BaseModel<TestigoModel>[] = [];

  loadPostulacionesInfo() {
    const uid = this.auth.uidUser();

    if (this.usuario.postulado?.transporte && uid) {
      this.vehiculoService.loadVehiculo(uid);

      // Subscribe to the state (which is now updated by loadVehiculo)
      this.vehiculoService.currentVehiculo$.pipe(takeUntil(this.destroy$)).subscribe(vehiculo => {
        if (vehiculo) {
          this.currentVehiculo = vehiculo;
          this.vehiculoStatus = vehiculo.aprobado ? 'Aprobado' : 'Pendiente';
          this.startLocationTracking();

          if (vehiculo.casaApoyoId) {
            this.casaApoyoService.getCasaApoyo(vehiculo.casaApoyoId).then(casa => {
              if (casa && casa.data) {
                this.vehiculoInfo = {
                  casaApoyo: casa.data.responsableNombre + ' ' + casa.data.responsableApellido || 'Casa asignada',
                  direccion: casa.data.direccion,
                  barrio: casa.data.barrio,
                  responsableTelefono: casa.data.responsableTelefono
                };
              }
            });
          }
        } else {
          this.currentVehiculo = null;
          this.vehiculoStatus = 'No registrado';
        }
      });
    }

    if (this.usuario.postulado?.casaApoyo && uid) {
      this.casaApoyoService.getCasasApoyoByResponsable(uid).pipe(takeUntil(this.destroy$)).subscribe(casas => {
        if (casas && casas.length > 0) {
          // Accessing data property since it returns BaseModel
          const casa = casas[0].data;
          const casaId = casas[0].id; // We need the ID to fetch vehicles
          this.casaApoyoStatus = casa.aprobado ? 'Aprobado' : 'Pendiente';
          localStorage.setItem('casaApoyo', JSON.stringify(casa));

          if (casa.aprobado && casaId) {
            this.vehiculoService.getVehiculosByCasaApoyo(casaId).pipe(takeUntil(this.destroy$)).subscribe(vehiculos => {
              this.casaApoyoVehiculos = vehiculos;
            });
          }

        } else {
          this.casaApoyoStatus = 'No registrado';
        }
      });
    }

    if (this.usuario.postulado?.testigo && uid) {
      if (this.usuario.puestoVotacionResponsableId) {
        this.testigoStatus = 'Aprobado';
        this.puestoVotacionService.getPuestoVotacion(this.usuario.puestoVotacionResponsableId).then(puesto => {
          if (puesto && puesto.data) {
            this.testigoStatus = 'Aprobado';
            this.testigoInfo = {
              puesto: puesto.data.nombre,
              mesa: ''
            };
          }
        }).catch(() => {
          this.testigoStatus = 'Pendiente';
        });
      } else {
        this.testigoStatus = 'Pendiente';
        this.testigoInfo = null;
      }

      // Fetch associated witnesses for Coordinador
      this.testigoAsociadoService.getTestigosByCoordinador(uid).pipe(takeUntil(this.destroy$)).subscribe(witnesses => {
        this.misTestigos = witnesses;
      });
    }
  }

  openDialogNotification() {
    this.dialog.open(DialogNotificationComponent, {
      data: { title: 'Bienvenido', message: 'Debes acceder a MIS DATOS y registrar tu información.', bottons: 'one', type: 'info' },
      width: '300px',
    });
  }

  openDialogMissingChurch() {
    this.dialog.open(DialogNotificationComponent, {
      data: {
        title: 'Atención',
        message: 'Debes comunicarte con algún coordinador de la zona para que te asocie a la zona a la que perteneces y que vas a apoyar',
        bottons: 'one',
        type: 'info'
      },
      width: '300px',
    });
  }

  closeInfoPerfil() {
    this.showInfoPerfil = false;
  }

  getBorderColor(status: string | null): string {
    switch (status) {
      case 'Aprobado':
      case 'Asignado':
        return 'border-green-500';
      case 'Pendiente':
      case 'Pendiente de asignación':
        return 'border-yellow-500';
      case 'No registrado':
        return 'border-gray-500';
      default:
        return 'border-red-500';
    }
  }

  getTextColor(status: string | null): string {
    switch (status) {
      case 'Aprobado':
      case 'Asignado':
        return 'text-green-600';
      case 'Pendiente':
      case 'Pendiente de asignación':
        return 'text-yellow-600';
      case 'No registrado':
        return 'text-gray-600';
      default:
        return 'text-red-600';
    }
  }

  // Vehicle status management
  currentVehiculo: VehiculoModel | null = null;
  userLocationWatchId: number | null = null;
  locationInterval: any = null;

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
    }
    if (this.userLocationWatchId !== null) {
      navigator.geolocation.clearWatch(this.userLocationWatchId);
    }
  }

  updateVehiculoStatus(estado: 'Activo' | 'Inactivo' | 'En carrera') {
    if (this.currentVehiculo && this.currentVehiculo.id) {
      this.vehiculoService.updateVehiculo(this.currentVehiculo.id, { ...this.currentVehiculo, estado: estado }).then(() => {
        if (this.currentVehiculo) {
          this.currentVehiculo.estado = estado;
          this.startLocationTracking();
        }
      });
    }
  }

  startLocationTracking() {
    // Clear any existing interval
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }

    if (!this.currentVehiculo || !this.currentVehiculo.id) return;

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          if (this.currentVehiculo && this.currentVehiculo.id) {
            const ubicacion = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            this.vehiculoService.updateVehiculo(this.currentVehiculo.id, {
              ...this.currentVehiculo,
              ubicacionActual: ubicacion
            });
          }
        }, (error) => {
          console.error('Error getting location', error);
        }, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      }
    };

    if (this.currentVehiculo.estado === 'Activo') {
      // Update immediately then every 2 minutes when Activo
      updateLocation();
      this.locationInterval = setInterval(updateLocation, 2 * 60 * 1000);
    } else if (this.currentVehiculo.estado === 'En carrera') {
      // Update immediately then every 5 minutes when En carrera
      updateLocation();
      this.locationInterval = setInterval(updateLocation, 1 * 60 * 1000);
    }
  }

  getUserLocation() {
    if (navigator.geolocation) {
      this.userLocationWatchId = navigator.geolocation.watchPosition((position) => {
        this.userLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      }, (error) => {
        console.error('Error getting user location', error);
      }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    }
  }

  // Helper for UI class
  getStatusColor(estado: string | undefined): string {
    switch (estado) {
      case 'Activo': return 'bg-green-100 text-green-800';
      case 'Inactivo': return 'bg-red-100 text-red-800';
      case 'En carrera': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  goToResultados() {
    this.dialog.open(EnviarResultadosVotacionComponent, {
      width: '500px',
      height: 'auto',
      panelClass: 'mat-dialog-md',
      data: {
        puestoVotacionId: this.usuario.puestoVotacionResponsableId,
        puestoNombre: this.testigoInfo?.puesto || 'Puesto de votación'
      },
      disableClose: true
    });
  }

  openDialogCrearCarrera() {
    this.dialog.open(DialogCrearCarreraComponent, {
      width: '400px',
      data: { usuario: this.usuario }
    });
  }

}
