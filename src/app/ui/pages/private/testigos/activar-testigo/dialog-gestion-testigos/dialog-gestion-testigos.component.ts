
import { Component, inject, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialogModule,
} from '@angular/material/dialog';
import {
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ToastrService } from 'ngx-toastr';
import { Observable } from 'rxjs';
import { PerfilModel } from '../../../../../../models/perfil/perfil.model';
import { BaseModel } from '../../../../../../models/base/base.model';
import { TestigoAsociadoService } from '../../../../../shared/services/testigo-asociado/testigo-asociado.service';
import { ButtonComponent } from '../../../../../shared/components/atoms/button/button.component';
import { InputTextComponent } from '../../../../../shared/components/atoms/input-text/input-text.component';
import { TitleComponent } from '../../../../../shared/components/atoms/title/title.component';
import { TestigoModel } from '../../../../../../models/testigo/testigo.model';
import { AuthService } from '../../../../../shared/services/auth/auth.service';
import { PuestoVotacionService } from '../../../../../shared/services/puesto-votacion/puesto-votacion.service';

@Component({
    selector: 'app-dialog-gestion-testigos',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatIconModule,
        ButtonComponent,
        InputTextComponent,
        TitleComponent
    ],
    templateUrl: './dialog-gestion-testigos.component.html',
})
export class DialogGestionTestigosComponent implements OnInit {
    form!: FormGroup;
    testigos: BaseModel<TestigoModel>[] = [];
    loading: boolean = false;
    puestosVotacionMap: Map<string, string> = new Map();
    private readonly authService: AuthService = inject(AuthService);
    private readonly puestoVotacionService: PuestoVotacionService = inject(PuestoVotacionService);

    constructor(
        public dialogRef: MatDialogRef<DialogGestionTestigosComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { coordinador: PerfilModel },
        private readonly fb: FormBuilder,
        private readonly testigoAsociadoService: TestigoAsociadoService,
        private readonly toast: ToastrService
    ) {
        this.form = this.fb.group({
            nombre: ['', Validators.required],
            apellido: ['', Validators.required],
            celular: [
                '',
                [
                    Validators.required,
                    Validators.pattern('^[0-9]*$'),
                    Validators.minLength(10),
                    Validators.maxLength(10),
                ],
            ],
            mesa: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
        });
    }

    ngOnInit(): void {
        this.loadPuestosVotacion();
        this.listarTestigos();
    }

    listarTestigos() {
        this.testigoAsociadoService.getTestigosByCoordinador(
            this.data.coordinador.id || ''
        ).subscribe((testigos) => {
            this.testigos = testigos;
        });
    }

    loadPuestosVotacion() {
        this.puestoVotacionService.getPuestosVotacion().subscribe((puestos) => {
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

    async onSubmit() {
        if (this.form.invalid) return;

        this.loading = true;
        const rawValue = this.form.getRawValue();

        const newTestigo: BaseModel<TestigoModel> = {
            data: {
                nombre: rawValue.nombre,
                apellido: rawValue.apellido,
                celular: rawValue.celular,
                uidLider: this.data.coordinador.id || '',
                mesa: rawValue.mesa,
            },
            fechaCreacion: new Date().toISOString(),
            creadoPor: this.authService.uidUser(),
        };

        try {
            await this.testigoAsociadoService.crearTestigoAsociado(newTestigo);
            this.toast.success('Testigo agregado correctamente');
            this.form.reset();
        } catch (error) {
            console.error(error);
            this.toast.error('Error al agregar testigo');
        } finally {
            this.loading = false;
        }
    }

    async deleteTestigo(id: string) {
        try {
            await this.testigoAsociadoService.deleteTestigoAsociado(id);
            this.toast.success('Testigo eliminado');
        } catch (error) {
            this.toast.error('Error al eliminar testigo');
        }
    }

    close() {
        this.dialogRef.close();
    }

    textErrormsn() {
        if (this.form.get('celular')?.hasError('required')) {
            return 'El campo celular es requerido';
        }
        if (this.form.get('celular')?.hasError('pattern')) {
            return 'El campo celular debe ser un número';
        }
        if (this.form.get('celular')?.hasError('minlength')) {
            return 'El campo celular debe tener 10 caracteres';
        }
        if (this.form.get('celular')?.hasError('maxlength')) {
            return 'El campo celular debe tener 10 caracteres';
        }
        return 'Error al agregar número';
    }

    textErrormsnMesa() {
        if (this.form.get('mesa')?.hasError('required')) {
            return 'El campo mesa es requerido';
        }
        return 'Error al agregar número';
    }
}
