import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    MAT_DIALOG_DATA,
    MatDialogRef,
    MatDialogModule,
} from '@angular/material/dialog';
import { ButtonComponent } from '../../../../shared/components/atoms/button/button.component';
import { TitleComponent } from '../../../../shared/components/atoms/title/title.component';
import { LIST_ROLES } from '../../../../shared/const/Permisos/list-roles.const';
import { FormsModule } from '@angular/forms';
import { PerfilModel } from '../../../../../models/perfil/perfil.model';

@Component({
    selector: 'app-dialog-control-accesos',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        ButtonComponent,
        TitleComponent,
        FormsModule,
    ],
    templateUrl: './dialog-control-accesos.component.html',
})
export class DialogControlAccesosComponent implements OnInit {
    roles = LIST_ROLES;

    // State for each role
    roleStates: { [key: string]: boolean } = {
        'Coordinador de iglesia': false,
        'Administrador de testigos': false,
        'Coordinador de transporte': false,
        'Coordinador de casa de apoyo': false,
    };

    constructor(
        public dialogRef: MatDialogRef<DialogControlAccesosComponent>,
        @Inject(MAT_DIALOG_DATA) public data: PerfilModel
    ) { }

    ngOnInit(): void {
        this.initializeRoles();
    }

    initializeRoles() {
        // Initialize based on user data
        if (this.data.rol === 'Coordinador de iglesia') {
            this.roleStates['Coordinador de iglesia'] = true;
        }

        if (this.data.coordinadorTransporte) {
            this.roleStates['Coordinador de transporte'] = true;
            this.roleStates['Coordinador de iglesia'] = true; // Enforce dependency
        }

        if (this.data.coordinadorCasaApoyo) {
            this.roleStates['Coordinador de casa de apoyo'] = true;
            this.roleStates['Coordinador de iglesia'] = true; // Enforce dependency
        }
    }

    isSelected(roleValue: string): boolean {
        return this.roleStates[roleValue] || false;
    }

    toggleRole(roleValue: string) {
        const newState = !this.roleStates[roleValue];
        this.roleStates[roleValue] = newState;

        // Logic:
        // "El pastor puede elegir Coordinador de iglesia y ya, que son permisos basicos"
        // "pero si escoge alguno de los demas tambien si o si debe seleccionar coordindor de iglesia"

        if (roleValue === 'Coordinador de iglesia') {
            if (!newState) {
                // If unchecking "Coordinador de iglesia", uncheck everything else
                this.roleStates['Administrador de testigos'] = false;
                this.roleStates['Coordinador de transporte'] = false;
                this.roleStates['Coordinador de casa de apoyo'] = false;
            }
        } else {
            // If checking any other role, ensure "Coordinador de iglesia" is checked
            if (newState) {
                this.roleStates['Coordinador de iglesia'] = true;
            }
        }
    }

    confirm() {
        // Prepare the result object
        const result = {
            rol: this.roleStates['Coordinador de iglesia'] ? 'Coordinador de iglesia' : 'Coordinador de iglesia',
            coordinadorTransporte: this.roleStates['Coordinador de transporte'],
            administradorTestigos: this.roleStates['Administrador de testigos'],
            coordinadorCasaApoyo: this.roleStates['Coordinador de casa de apoyo']
        };

        this.dialogRef.close(result);
    }

    close() {
        this.dialogRef.close();
    }
}
