import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { PuestoVotacionService } from '../../../shared/services/puesto-votacion/puesto-votacion.service';
import { CuentavotosService } from '../../../shared/services/cuentavotos/cuentavotos.service';
import { InputSelectComponent } from '../../components/atoms/input-select/input-select.component';
import { ButtonComponent } from '../../components/atoms/button/button.component';
import { SelectOptionModel } from '../../../../models/base/select-options.model';
import { CuentavotosModel } from '../../../../models/cuentavotos/cuentavotos.model';
import { BaseModel } from '../../../../models/base/base.model';
import { PuestoVotacionModel } from '../../../../models/puesto-votacion/puesto-votacion.model';

@Component({
    selector: 'app-dialog-ver-resultados',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatIconModule,
        MatButtonModule,
        InputSelectComponent,
        ButtonComponent
    ],
    templateUrl: './dialog-ver-resultados.component.html',
    styleUrls: ['./dialog-ver-resultados.component.scss']
})
export class DialogVerResultadosComponent implements OnInit, OnDestroy {
    private puestoService = inject(PuestoVotacionService);
    private cuentavotosService = inject(CuentavotosService);
    private dialogRef = inject(MatDialogRef<DialogVerResultadosComponent>);

    puestosOptions: SelectOptionModel<string>[] = [];
    puestoControl = new FormControl('');
    resultados: BaseModel<CuentavotosModel>[] = [];
    loading = false;
    loadingPuestos = false;

    private subscriptions = new Subscription();

    ngOnInit(): void {
        this.loadPuestos();
        this.subscriptions.add(
            this.puestoControl.valueChanges.subscribe(puestoId => {
                if (puestoId) {
                    this.loadResultados(puestoId);
                } else {
                    this.resultados = [];
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }

    loadPuestos(): void {
        this.loadingPuestos = true;
        this.subscriptions.add(
            this.puestoService.getPuestosVotacion().subscribe({
                next: (puestos: BaseModel<PuestoVotacionModel>[]) => {
                    this.puestosOptions = puestos.map((p: BaseModel<PuestoVotacionModel>) => ({
                        label: p.data.nombre,
                        value: p.id!
                    }));
                    this.loadingPuestos = false;
                },
                error: (err: any) => {
                    console.error('Error loading polling stations:', err);
                    this.loadingPuestos = false;
                }
            })
        );
    }

    loadResultados(puestoId: string): void {
        this.loading = true;
        this.subscriptions.add(
            this.cuentavotosService.getCuentavotosByPuesto(puestoId).subscribe({
                next: (res: BaseModel<CuentavotosModel>[]) => {
                    this.resultados = res;
                    this.loading = false;
                },
                error: (err: any) => {
                    console.error('Error loading results:', err);
                    this.loading = false;
                }
            })
        );
    }

    close(): void {
        this.dialogRef.close();
    }
}
