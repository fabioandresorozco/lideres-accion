import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../shared/services/auth/auth.service';
import { CARDS_HOME } from '../../../shared/const/cards.const';
import { CardModel } from '../../../../models/utils/card.model';
import { MenuItemComponent } from '../../../shared/components/modules/menu-item/menu-item.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogCasasApoyoComponent } from '../../../shared/dialogs/dialog-casas-apoyo/dialog-casas-apoyo.component';
import { DialogOpcionesVehicularComponent } from '../../../shared/dialogs/dialog-opciones-vehicular/dialog-opciones-vehicular.component';
import { DialogTestigosComponent } from '../../../shared/dialogs/dialog-opciones-testigos/dialog-testigos.component';
import { PerfilModel } from '../../../../models/perfil/perfil.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, MenuItemComponent, MatDialogModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  cards: CardModel[] = CARDS_HOME;
  usuario: PerfilModel = JSON.parse(localStorage.getItem('usuario') || '{}');
  userRol: string = this.usuario.rol || '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
    public dialog: MatDialog
  ) { }

  async logout() {
    try {
      await this.auth.logout();
      this.router.navigate(['./public/login']);
    } catch (error) {
      console.error(error);
    }
  }

  showCard(rol: string[], requiresPostulacion?: string): boolean {
    // Role check
    const isCoordinadorTransporte = rol.includes('Coordinador de transporte') && this.usuario.coordinadorTransporte;
    const isCoordinadorCasaApoyo = rol.includes('Coordinador de casa de apoyo') && this.usuario.coordinadorCasaApoyo;

    const roleAllowed = rol.includes(this.userRol) || rol.includes('Todos') || isCoordinadorTransporte || isCoordinadorCasaApoyo;

    if (!roleAllowed) return false;

    // Postulacion check
    if (requiresPostulacion) {
      if (!this.usuario.postulado) return false;
      // Access dynamic property of IPostuladoModel
      return (this.usuario.postulado as any)[requiresPostulacion] === true;
    }

    return true;
  }

  handleClick(card: CardModel) {
    if (card.action) {
      this.openDialog(card.action);
    }
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
        if (this.usuario.rol === 'Pastor' || this.usuario.rol === 'Super usuario' || this.usuario.rol === 'Coordinador de iglesia' || this.usuario.coordinadorTransporte) {
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
}
