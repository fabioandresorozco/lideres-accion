import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CuentavotosService } from '../../../shared/services/cuentavotos/cuentavotos.service';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { InputTextComponent } from '../../../shared/components/atoms/input-text/input-text.component';
import { ButtonComponent } from '../../../shared/components/atoms/button/button.component';
import { CuentavotosModel } from '../../../../models/cuentavotos/cuentavotos.model';
import { DialogNotificationComponent } from '../../../shared/dialogs/dialog-notification/dialog-nofication.component';
import { DialogNotificationModel } from '../../../../models/base/dialog-notification.model';
import { BaseModel } from '../../../../models/base/base.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-enviar-resultados-votacion',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        MatDialogModule,
        InputTextComponent,
        ButtonComponent,
    ],
    templateUrl: './enviar-resultados-votacion.component.html',
    styleUrls: ['./enviar-resultados-votacion.component.scss'],
})
export class EnviarResultadosVotacionComponent {
    form: FormGroup;
    loading = false;
    envioExitoso = false;
    editingMesa = false;
    misResultados: BaseModel<CuentavotosModel>[] = [];
    private subscription: Subscription | null = null;

    private fb = inject(FormBuilder);
    private cuentavotosService = inject(CuentavotosService);
    private authService = inject(AuthService);
    private dialog = inject(MatDialog);
    private router = inject(Router);
    private dialogRef = inject(MatDialogRef<EnviarResultadosVotacionComponent>);
    public data = inject<{ puestoVotacionId: string; puestoNombre: string }>(MAT_DIALOG_DATA);

    constructor() {
        this.form = this.fb.group({
            senado: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
            camara: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
            mesa: ['', [Validators.required, Validators.pattern('^[0-9]*$')]]
        });
    }

    async ngOnInit() {
        if (this.data?.puestoVotacionId) {
            this.loadMisResultados();
        } else {
            this.showNotification('error', 'Error', 'No se ha proporcionado el puesto de votación.');
            this.dialogRef.close();
        }
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    loadMisResultados() {
        this.loading = true;
        this.subscription = this.cuentavotosService.getCuentavotosByPuesto(this.data.puestoVotacionId).subscribe({
            next: (resultados) => {
                this.misResultados = resultados;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading results:', err);
                this.loading = false;
            }
        });
    }

    toggleEditMesa() {
        this.editingMesa = !this.editingMesa;
        if (this.editingMesa) {
            this.form.get('mesa')?.enable();
        } else {
            this.form.get('mesa')?.disable();
            // Optionally reset to original value if cancelled, currently it keeps the edit
        }
    }

    async enviarResultados() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;
        try {
            const now = new Date().toISOString();
            const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

            const votosData: CuentavotosModel = {
                puestoVotacionId: this.data.puestoVotacionId,
                mesaVotacion: Number(this.form.get('mesa')?.value),
                senado: Number(this.form.get('senado')?.value),
                camara: Number(this.form.get('camara')?.value), 
            };

            const resultados: BaseModel<CuentavotosModel> = {
                data: votosData,
                fechaCreacion: now,
                creadoPor: usuario.id || this.authService.uidUser(),
            };

            await this.cuentavotosService.crearCuentavotos(resultados);

            this.showNotification('success', 'Éxito', 'Resultados registrados.');
            this.form.reset();
        } catch (error) {
            console.error(error);
            this.showNotification('error', 'Error', 'Error al enviar los resultados.');
        } finally {
            this.loading = false;
        }
    }

    resetForm() {
        this.form.reset();
        this.editingMesa = false;
    }

    cancelar() {
        this.dialogRef.close();
    }

    private showNotification(type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) {
        const data: DialogNotificationModel = {
            type,
            title,
            message,
            bottons: 'one'
        };
        this.dialog.open(DialogNotificationComponent, {
            data,
            width: '400px',
            panelClass: 'dialog-notification'
        });
    }
}
