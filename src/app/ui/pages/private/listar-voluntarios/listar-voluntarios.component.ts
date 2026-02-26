import { Component, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MgPaginatorComponent, PageEvent } from '../../../shared/components/modules/paginator/paginator.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PerfilService } from '../../../shared/services/perfil/perfil.service';
import { PerfilModel } from '../../../../models/perfil/perfil.model';
import { MatIconModule } from '@angular/material/icon';
import { InputTextComponent } from '../../../shared/components/atoms/input-text/input-text.component';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { CardInfoComponent } from '../../../shared/components/cards/card-info/card-info.component';
import { TitleComponent } from '../../../shared/components/atoms/title/title.component';
import { ToastrService } from 'ngx-toastr';
import { VehiculoService } from '../../../shared/services/vehiculo/vehiculo.service';
import { CasaApoyoService } from '../../../shared/services/casa-apoyo/casa-apoyo.service';
import { firstValueFrom } from 'rxjs';
import { SpinnerComponent } from '../../../shared/components/modules/spinner/spinner.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogNotificationComponent } from '../../../shared/dialogs/dialog-notification/dialog-nofication.component';
import { DialogNotificationModel } from '../../../../models/base/dialog-notification.model';

@Component({
    selector: 'app-listar-voluntarios',
    standalone: true,
    imports: [
        CommonModule,
        CommonModule,
        MatTableModule, // Keep for DataSource type usage if needed, though we don't use mat-table in template
        MgPaginatorComponent,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        InputTextComponent,
        ReactiveFormsModule,
        CardInfoComponent,
        TitleComponent,
        SpinnerComponent,
        MatDialogModule
    ],
    templateUrl: './listar-voluntarios.component.html',
    styleUrls: ['./listar-voluntarios.component.scss']
})
export class ListarVoluntariosComponent implements AfterViewInit {
    dataSource = new MatTableDataSource<PerfilModel>([]);
    paginatedVoluntarios: PerfilModel[] = []; // Array to hold the current page's data
    usuario: PerfilModel = JSON.parse(localStorage.getItem('usuario') || '{}');
    searchControl = new FormControl('');

    // Pagination state
    pageIndex: number = 0;
    pageSize: number = 5;
    pageSizeOptions: number[] = [5, 10, 25, 100];

    displayedColumns: string[] = ['nombres', 'apellidos', 'email', 'rol', 'coordinadorCasaApoyo', 'coordinadorTransporte', 'administradorTestigos', 'celular', 'noCuenta', 'acciones'];

    // Modal state
    showSpinner: boolean = false;


    constructor(
        private perfilService: PerfilService,
        private toast: ToastrService,
        private vehiculoService: VehiculoService,
        private casaApoyoService: CasaApoyoService,
        private dialog: MatDialog
    ) {
        this.cargarVoluntarios();
        this.searchControl.valueChanges.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(value => {
            this.applyFilter(value || '');
        });
    }

    cargarVoluntarios() {
        if (this.usuario.rol === 'Super usuario') {
            this.perfilService.getPerfiles().subscribe(data => {
                this.dataSource.data = data.filter(perfil => perfil.rol !== 'Super usuario');
                this.updatePaginatedList();
                if (this.searchControl.value) {
                    this.applyFilter(this.searchControl.value);
                }
            });
        } else if (this.usuario.iglesia && this.usuario.rol === 'Pastor' && this.usuario.iglesia.id) {
            this.perfilService.getPerfilesByIglesia(this.usuario.iglesia.id).subscribe(data => {
                this.dataSource.data = data.filter(perfil => perfil.rol !== 'Pastor');
                this.updatePaginatedList();
                if (this.searchControl.value) {
                    this.applyFilter(this.searchControl.value);
                }
            });
        }
    }

    ngAfterViewInit() {
        // Removed MatPaginator logic
    }

    applyFilter(filterValue: string) {
        this.dataSource.filterPredicate = (data: PerfilModel, filter: string) => {
            const email = data.email ? data.email.toLowerCase() : '';
            const nombre = data.nombres ? data.nombres.toLowerCase() : '';
            const apellido = data.apellidos ? data.apellidos.toLowerCase() : '';
            const searchStr = filter.trim().toLowerCase();

            return email.includes(searchStr) || nombre.includes(searchStr) || apellido.includes(searchStr);
        };
        this.dataSource.filter = filterValue.trim().toLowerCase();

        this.dataSource.filter = filterValue.trim().toLowerCase();

        this.pageIndex = 0; // Reset to first page on filter
        this.updatePaginatedList();
    }

    updatePaginatedList() {
        const startIndex = this.pageIndex * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.paginatedVoluntarios = this.dataSource.filteredData.slice(startIndex, endIndex);
    }

    onPageChange(event: PageEvent) {
        this.pageIndex = event.pageIndex;
        this.pageSize = event.pageSize;
        this.updatePaginatedList();
    }

    abrirModalEliminar(perfil: PerfilModel) {
        const dialogRef = this.dialog.open(DialogNotificationComponent, {
            width: '400px',
            data: {
                title: 'Eliminar Voluntario',
                message: `¿Está seguro que desea eliminar a ${perfil.nombres} ${perfil.apellidos}? Esta acción no se puede deshacer.`,
                type: 'warning',
                bottons: 'two',
                actionText: 'Eliminar'
            } as DialogNotificationModel
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                if (perfil.id) {
                    this.confirmarEliminacion(perfil.id);
                }
            }
        });
    }

    async confirmarEliminacion(id: string) {
        this.showSpinner = true;
        try {
            // 1. Delete associated Vehicles
            const vehiculos = await firstValueFrom(this.vehiculoService.getVehiculoByConductor(id));
            if (vehiculos && vehiculos.length > 0) {
                for (const vehiculo of vehiculos) {
                    if (vehiculo.id) {
                        await this.vehiculoService.deleteVehiculo(vehiculo.id);
                    }
                }
            }

            // 2. Delete associated Casas Apoyo
            const casas = await firstValueFrom(this.casaApoyoService.getCasasApoyoByResponsable(id));
            if (casas && casas.length > 0) {
                for (const casa of casas) {
                    if (casa.id) {
                        await this.casaApoyoService.deleteCasaApoyo(casa.id);
                    }
                }
            }

            // 4. Delete Profile
            await this.perfilService.deleteperfil(id);

            // Refresh list
            this.cargarVoluntarios();
        } catch (error) {
            console.error(error);
            this.toast.error('Error al eliminar usuario y sus datos asociados.');
        } finally {
            this.showSpinner = false;
        }
    }
}
