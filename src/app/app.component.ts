import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit, ApplicationRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { ToastrService } from 'ngx-toastr';
import { concat, interval } from 'rxjs';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private readonly swUpdate: SwUpdate,
    private readonly toastr: ToastrService,
    private readonly appRef: ApplicationRef
  ) { }

  ngOnInit(): void {
    // 1. Verificar que el Service Worker esté habilitado
    if (this.swUpdate.isEnabled) {

      // 2. Suscribirse al evento para nuevas versiones
      this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {
        // El evento VersionReadyEvent (parte de VersionEvent) es cuando la nueva versión está lista.
        if (event.type === 'VERSION_READY') {
          // 3. Notificar al usuario y forzar la actualización
          this.promptUpdate();
        }
      });

      // 4. Manejar estado irrecuperable (ej. discrepancia en caché de assets PWA)
      this.swUpdate.unrecoverable.subscribe(event => {
        this.toastr.error('Estado de la aplicación irrecuperable. Recargando...', 'Error Crítico');
        setTimeout(() => document.location.reload(), 2000);
      });

      // 5. Polling periódico de actualizaciones (Recomendado por Angular)
      // Permite estabilizar la app primero para que no bloquee renderizado
      const appIsStable$ = this.appRef.isStable.pipe(first(isStable => isStable === true));
      const everyHour$ = interval(60 * 60 * 1000); // 1 hora de polling
      const everyHourOnceAppIsStable$ = concat(appIsStable$, everyHour$);

      everyHourOnceAppIsStable$.subscribe(() => {
        this.swUpdate.checkForUpdate();
      });

      // Opcional: Esto fuerza al Service Worker a verificar actualizaciones de inmediato,
      // útil en entornos donde las verificaciones automáticas no son lo suficientemente rápidas.
      this.swUpdate.checkForUpdate();
    }
  }

  private promptUpdate(): void {
    const message = 'Hay una nueva versión de la aplicación disponible. Se actualizará en el próximo inicio o puedes recargar ahora.';

    this.toastr.info(message, 'Nueva Versión', {
      timeOut: 5000,
      progressBar: true,
      closeButton: true,
      disableTimeOut: false,
      tapToDismiss: true
    });

    // We no longer force a reload here to avoid interrupting the user.
    // The Service Worker will activate the update in the background, 
    // and the new version will be served on the next reload.
    this.swUpdate.activateUpdate();
  }
}

