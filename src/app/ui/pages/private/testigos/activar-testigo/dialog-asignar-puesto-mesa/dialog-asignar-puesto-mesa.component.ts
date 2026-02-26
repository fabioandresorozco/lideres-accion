import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { ButtonComponent } from '../../../../../shared/components/atoms/button/button.component';
import { TitleComponent } from '../../../../../shared/components/atoms/title/title.component';
import { PuestoVotacionService } from '../../../../../shared/services/puesto-votacion/puesto-votacion.service';
import { InputSelectComponent } from '../../../../../shared/components/atoms/input-select/input-select.component';
import { SelectOptionModel } from '../../../../../../models/base/select-options.model';

@Component({
    selector: 'app-dialog-asignar-puesto-mesa',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        ButtonComponent,
        TitleComponent,
        InputSelectComponent
    ],
    templateUrl: './dialog-asignar-puesto-mesa.component.html',
    styleUrls: ['./dialog-asignar-puesto-mesa.component.scss']
})
export class DialogAsignarPuestoMesaComponent implements OnInit {
    form: FormGroup;
    puestosOptions: SelectOptionModel<any>[] = [];

    maxMesas: number = 100;

    constructor(
        private fb: FormBuilder,
        public dialogRef: MatDialogRef<DialogAsignarPuestoMesaComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private readonly puestoVotacionService: PuestoVotacionService
    ) {
        this.form = this.fb.group({
            puestodevotacion: ['', [Validators.required]],
        });


        this.form.get('puestodevotacion')?.valueChanges.subscribe((value) => {
            if (value && value.mesastotales) {
                this.maxMesas = value.mesastotales;
                const mesaControl = this.form.get('mesadevotacion');
                mesaControl?.setValidators([
                    Validators.required,
                    Validators.min(1),
                    Validators.max(this.maxMesas),
                    Validators.pattern("^[0-9]*$")
                ]);
                mesaControl?.updateValueAndValidity();
            }
        });
    }

    ngOnInit(): void {
            this.loadPuestos();
    }

    loadPuestos() {
        this.puestoVotacionService.getPuestosVotacion().subscribe(puestos => {
            this.puestosOptions = puestos.map(p => ({
                label: p.data.nombre,
                value: p.id
            }));
        });
    }

    save() {
       this.dialogRef.close(this.form.value);
       this.form.reset();

    }

    close() {
        this.dialogRef.close();
    }
}
