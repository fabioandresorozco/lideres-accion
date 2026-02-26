import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TitleComponent } from '../../../../shared/components/atoms/title/title.component';
import { CardAprobacionComponent } from '../../../../shared/components/cards/card-aprobacion/card-aprobacion.component';
import { MgPaginatorComponent, PageEvent } from '../../../../shared/components/modules/paginator/paginator.component';
import { PerfilService } from '../../../../shared/services/perfil/perfil.service';
import { DialogNotificationComponent } from '../../../../shared/dialogs/dialog-notification/dialog-nofication.component';
import { PerfilModel } from '../../../../../models/perfil/perfil.model';
import { BaseModel } from '../../../../../models/base/base.model';
import { DialogAsignarPuestoMesaComponent } from './dialog-asignar-puesto-mesa/dialog-asignar-puesto-mesa.component';
import { PuestoVotacionService } from '../../../../shared/services/puesto-votacion/puesto-votacion.service';
import { PuestoVotacionModel } from '../../../../../models/puesto-votacion/puesto-votacion.model';
import { DialogGestionTestigosComponent } from './dialog-gestion-testigos/dialog-gestion-testigos.component';

@Component({
    selector: 'app-activar-testigo',
    standalone: true,
    imports: [
        CommonModule,
        TitleComponent,
        CardAprobacionComponent,
        MgPaginatorComponent
    ],
    templateUrl: './activar-testigo.component.html',
})
export class ActivarTestigoComponent implements OnInit {
    testigos: PerfilModel[] = [];
    paginatedTestigos: PerfilModel[] = [];
    existingTestigosIds: Set<string> = new Set();
    pageSize: number = 5;
    pageIndex: number = 0;
    puestosVotacion: BaseModel<PuestoVotacionModel>[] = [];
    puestosVotacionMap: Map<string, string> = new Map();

    constructor(
        private readonly perfilService: PerfilService,
        private readonly dialog: MatDialog,
        private readonly puestoVotacionService: PuestoVotacionService
    ) { }

    ngOnInit(): void {
        this.loadData();
        this.loadPuestosVotacion();
    }

    loadData() {
        this.perfilService.getPostuladosTestigos().subscribe((perfiles) => {
            this.testigos = perfiles;
            this.updatePagination();
        });
    }

    loadPuestosVotacion() {
        this.puestoVotacionService.getPuestosVotacion().subscribe((puestos) => {
            this.puestosVotacion = puestos;
            this.puestosVotacionMap.clear();
            puestos.forEach(p => {
                if (p.id) {
                    this.puestosVotacionMap.set(p.id, p.data.nombre);
                }
            });
        });
    }

    getPuestoVotacionName(id?: string | null): string {
        if (!id) return 'Sin asignar';
        return this.puestosVotacionMap.get(id) || 'Sin asignar';
    }

    searchNamePueto(name: string) {
        const result = this.puestosVotacion.filter((puesto) => puesto.data.nombre.toLowerCase().includes(name.toLowerCase()));
        return result.length > 0 ? result[0].data.nombre : 'Sin asignar';
    }

    updatePagination() {
        const start = this.pageIndex * this.pageSize;
        const end = start + this.pageSize;
        this.paginatedTestigos = this.testigos.slice(start, end);
    }

    onPageChange(event: PageEvent) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.updatePagination();
    }

    async aprobarTestigo(perfil: PerfilModel, isChecked: boolean) {
        if (isChecked) {
            const dialogRef = this.dialog.open(DialogAsignarPuestoMesaComponent, {
                width: '400px',
                disableClose: true,
                data: { iglesiaId: perfil.iglesia }
            });

            dialogRef.afterClosed().subscribe(async (result) => {
                console.log(result);
                try {
                    await this.perfilService.updatePerfil(perfil.id!, { puestoVotacionResponsableId: result.puestodevotacion } as any);
                    this.dialog.open(DialogNotificationComponent, {
                        data: {
                            title: 'Éxito',
                            message: 'Testigo activado correctamente',
                            bottons: 'Aceptar',
                            type: 'success',
                        },
                    });
                } catch (error) {
                    this.dialog.open(DialogNotificationComponent, {
                        data: {
                            title: 'Error',
                            message: 'Error al activar puesto de votación',
                            bottons: 'Aceptar',
                            type: 'error',
                        },
                    });
                }

            });
        } else {
            const dialogRef = this.dialog.open(DialogNotificationComponent, {
                data: {
                    title: 'Confirmar',
                    message: '¿Está seguro que desea desasociar a este usuario del listado de coordinadores?',
                    bottons: 'two',
                    type: 'warning',
                },
            });

            dialogRef.afterClosed().subscribe(async (result) => {
                if (result) {
                    try {
                        if (perfil.id) {
                            await this.perfilService.updatePerfil(perfil.id, { puestoVotacionResponsableId: '' } as any);
                            this.dialog.open(DialogNotificationComponent, {
                                data: {
                                    title: 'Éxito',
                                    message: 'Coordinador desasociado correctamente',
                                    bottons: 'Aceptar',
                                    type: 'success',
                                },
                            });
                        }
                    } catch (error) {
                        this.dialog.open(DialogNotificationComponent, {
                            data: {
                                title: 'Error',
                                message: 'Error al desasociar coordinador',
                                bottons: 'Aceptar',
                                type: 'error',
                            },
                        });
                    }
                }
            });
        }
    }

    isChecked(perfil: PerfilModel): boolean {
        return !!perfil.puestoVotacionResponsableId;
    }

    openGestionWitnessDialog(coordinador: PerfilModel) {
        this.dialog.open(DialogGestionTestigosComponent, {
            width: '600px',
            data: { coordinador }
        });
    }
}
