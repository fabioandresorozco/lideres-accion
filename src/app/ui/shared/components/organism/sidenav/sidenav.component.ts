import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CARDS_HOME } from '../../../const/cards.const';
import { CardModel } from '../../../../../models/utils/card.model';
import { PerfilModel } from '../../../../../models/perfil/perfil.model';
import { AuthService } from '../../../services/auth/auth.service';
import { DialogOpcionesVehicularComponent } from '../../../dialogs/dialog-opciones-vehicular/dialog-opciones-vehicular.component';
import { DialogCasasApoyoComponent } from '../../../dialogs/dialog-casas-apoyo/dialog-casas-apoyo.component';
import { DialogTestigosComponent } from '../../../dialogs/dialog-opciones-testigos/dialog-testigos.component';
import { DialogNotificationComponent } from '../../../dialogs/dialog-notification/dialog-nofication.component';
import { PwaService } from '../../../../../shared/services/pwa/pwa.service';
import { DialogInstallGuideComponent } from '../../../dialogs/dialog-install-guide/dialog-install-guide.component';

@Component({
    selector: 'mg-sidenav',
    standalone: true,
    imports: [CommonModule, RouterModule, MatIconModule, MatDialogModule],
    templateUrl: './sidenav.component.html',
})
export class SidenavComponent {
    @Input() isOpen = false;
    @Input() usuario!: PerfilModel;
    @Output() close = new EventEmitter<void>();

    cards = CARDS_HOME;

    constructor(
        private readonly auth: AuthService,
        private readonly router: Router,
        public dialog: MatDialog,
        private readonly pwaService: PwaService
    ) { }

    get userRol(): string {
        return this.usuario?.rol || '';
    }

    showCard(rol: string[] | undefined, requiresPostulacion?: string): boolean {
        if (!rol) return false;
        if (!this.usuario) return false;

        // Check if user is a coordinator if those roles are allowed
        const isCoordinadorTransporte = rol.includes('Coordinador de transporte') && this.usuario.coordinadorTransporte;
        const isCoordinadorCasaApoyo = rol.includes('Coordinador de casa de apoyo') && this.usuario.coordinadorCasaApoyo;

        const roleAllowed = rol.includes(this.userRol) || rol.includes('Todos') || isCoordinadorTransporte || isCoordinadorCasaApoyo;
        if (!roleAllowed) return false;

        if (requiresPostulacion) {
            // Admin roles that override postulado requirement
            const adminRoles = ['Pastor', 'Super usuario'];
            if (adminRoles.includes(this.userRol)) return true;

            // Specific coordinator roles that override postulado requirement
            if (requiresPostulacion === 'transporte' && this.usuario.coordinadorTransporte) return true;
            if (requiresPostulacion === 'casaApoyo' && this.usuario.coordinadorCasaApoyo) return true;

            if (!this.usuario.postulado) return false;
            return (this.usuario.postulado as any)[requiresPostulacion] === true;
        }
        return true;
    }

    handleClick(card: CardModel) {
        if (card.action) {
            this.openDialog(card.action);
        }
        this.close.emit();
    }

    openDialog(action: string) {
        switch (action) {
            case 'vehiculo':
                if (this.usuario.rol === 'Pastor' || this.usuario.rol === 'Super usuario' || this.usuario.rol === 'Coordinador de iglesia' || this.usuario.coordinadorTransporte) {
                    this.dialog.open(DialogOpcionesVehicularComponent, {
                        data: { name: 'mi-carro' },
                        width: '300px',
                    });
                } else {
                    this.router.navigate(['/private/mi-vehiculo']);
                }
                break;
            case 'casa-apoyo':
                if (this.usuario.rol === 'Pastor' || this.usuario.rol === 'Super usuario' || this.usuario.rol === 'Coordinador de iglesia' || this.usuario.coordinadorCasaApoyo) {
                    this.dialog.open(DialogCasasApoyoComponent, {
                        data: { name: 'mi-casa-apoyo' },
                        width: '300px',
                    });
                } else {
                    this.router.navigate(['/private/mi-casa-de-apoyo']);
                }
                break;
            case 'testigo':
                if (this.usuario.rol === 'Pastor' || this.usuario.rol === 'Super usuario') {
                    this.dialog.open(DialogTestigosComponent, {
                        data: { name: 'mi-testigos' },
                        width: '300px',
                    });
                } else {
                    this.router.navigate(['/private/activar-testigo']);
                }
                break;
        }
    }

    logout() {

        const dialogRef = this.dialog.open(DialogNotificationComponent, {
            data: { title: 'Cerrar sesión', message: '¿Estás seguro que deseas cerrar sesión?', type: 'warning', bottons: 'two' },
            width: '400px',
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                localStorage.clear();
                this.auth.logout();
                this.router.navigate(['./public/login']);
                this.close.emit();
            }
        });
    }

    get showInstallButton() {
        return this.pwaService.showInstallButton;
    }

    async installPwa() {
        const manualInstall = await this.pwaService.installPwa();
        if (manualInstall) {
            this.dialog.open(DialogInstallGuideComponent, {
                data: { platform: this.pwaService.currentPlatform },
                width: '400px'
            });
        }
        this.close.emit();
    }
}
