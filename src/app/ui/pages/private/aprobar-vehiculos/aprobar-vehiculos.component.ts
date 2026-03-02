import { Component, inject, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VehiculoService } from '../../../shared/services/vehiculo/vehiculo.service';

import { VehiculoModel } from '../../../../models/vehiculo/vehiculo.model';
import { MatDialog } from '@angular/material/dialog';
import { DialogNotificationComponent } from '../../../shared/dialogs/dialog-notification/dialog-nofication.component';
import { Action } from 'rxjs/internal/scheduler/Action';
import { MatIconModule } from '@angular/material/icon';
import { TitleComponent } from "../../../shared/components/atoms/title/title.component";
import { MatTableDataSource } from '@angular/material/table';
import { CardAprobacionComponent } from '../../../shared/components/cards/card-aprobacion/card-aprobacion.component';
import { MgPaginatorComponent, PageEvent } from '../../../shared/components/modules/paginator/paginator.component';
import { PerfilModel } from '../../../../models/perfil/perfil.model';

@Component({
    selector: 'app-aprobar-vehiculos',
    standalone: true,
    imports: [CommonModule, MatIconModule, TitleComponent, MgPaginatorComponent, CardAprobacionComponent],
    templateUrl: './aprobar-vehiculos.component.html',
    styleUrls: ['./aprobar-vehiculos.component.scss']
})
export class AprobarVehiculosComponent implements OnInit, AfterViewInit {
    private readonly vehiculoService = inject(VehiculoService);
    private readonly dialog = inject(MatDialog);

    dataSource = new MatTableDataSource<VehiculoModel>([]);
    paginatedVehiculos: VehiculoModel[] = [];
    usuario: PerfilModel = JSON.parse(localStorage.getItem('usuario') || '{}');

    pageIndex: number = 0;
    pageSize: number = 5;

    ngOnInit() {
        this.loadVehiculos();
    }

    ngAfterViewInit() {

    }

    loadVehiculos() {
        if (this.usuario.iglesia?.id) {
            this.vehiculoService.getVehiculosByIglesia(this.usuario.iglesia.id).subscribe({
                next: (data) => {
                    this.dataSource.data = data;
                    this.updatePaginatedList();
                },
                error: (err) => console.error(err)
            });
        }
    }

    updatePaginatedList() {
        const startIndex = this.pageIndex * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.paginatedVehiculos = this.dataSource.data.slice(startIndex, endIndex);
    }

    onPageChange(event: PageEvent) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.updatePaginatedList();
    }

    desasignar(vehiculo: VehiculoModel) {
        const dialogRef = this.dialog.open(DialogNotificationComponent, {
            data: {
                title: 'Confirmación',
                message: `¿Estás seguro de desasignar el vehículo ${vehiculo.placa}?`,
                type: 'warning',
                bottons: 'two',
                actionText: 'Desasignar'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.vehiculoService.updateVehiculo(vehiculo.id!, { ...vehiculo, iglesia: null }).then(() => {
                    this.dialog.open(DialogNotificationComponent, {
                        data: {
                            title: 'Desasignado',
                            message: 'Vehículo desasignado correctamente.',
                            type: 'success'
                        }
                    });
                }).catch(err => {
                    console.error(err);
                    this.dialog.open(DialogNotificationComponent, {
                        data: {
                            title: 'Error',
                            message: 'Ocurrió un error al desasignar el vehículo.',
                            type: 'error'
                        }
                    });
                });
            }
        });
    }

    loadingItems = new Set<string>();

    aprobarVehiculo(vehiculo: VehiculoModel, estado: boolean) {
        if (this.loadingItems.has(vehiculo.id!)) return;

        const executeUpdate = () => {
            this.loadingItems.add(vehiculo.id!);
            this.vehiculoService.updateVehiculo(vehiculo.id!, {
                ...vehiculo,
                aprobado: estado,
                casaApoyoId: null,
                aprobadoPor: estado ? this.usuario.email : null
            })
                .then(() => {
                    // this.dialog.open(DialogNotificationComponent, {
                    //     data: {
                    //         title: 'Éxito',
                    //         message: `Vehículo ${estado ? 'aprobado' : 'desaprobado'} correctamente.`,
                    //         type: 'success'
                    //     }
                    // });
                    this.loadVehiculos();
                })
                .catch(err => {
                    console.error(err);
                    this.dialog.open(DialogNotificationComponent, {
                        data: {
                            title: 'Error',
                            message: 'Ocurrió un error al actualizar el estado del vehículo.',
                            type: 'error'
                        }
                    });
                })
                .finally(() => {
                    this.loadingItems.delete(vehiculo.id!);
                });
        };

        if (!estado) {
            const dialogRef = this.dialog.open(DialogNotificationComponent, {
                data: {
                    title: 'Confirmación',
                    message: `¿Estás seguro de desaprobar el vehículo ${vehiculo.placa}?`,
                    type: 'warning',
                    bottons: 'two',
                    actionText: 'Desaprobar'
                }
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    executeUpdate();
                } else {
                    // Revert checkbox state if cancelled (optional/complex depending on UI reflow)
                    // For now we just don't execute. Ideally we should reload or handle UI state if it was optimistic.
                    // Since it's triggered by checking/unchecking, the UI might be out of sync if we don't refresh or revert.
                    // But typically the checked property is bound to data. reloading might be safest or manually toggling back.
                    this.loadVehiculos(); // Refresh to ensure UI matches state
                }
            });
        } else {
            executeUpdate();
        }
    }
}
