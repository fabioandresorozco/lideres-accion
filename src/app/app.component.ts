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
      const everyFiveMin$ = interval(5 * 60 * 1000); // 5 minutos de polling
      const everyFiveMinOnceAppIsStable$ = concat(appIsStable$, everyFiveMin$);

      everyFiveMinOnceAppIsStable$.subscribe(() => {
        this.swUpdate.checkForUpdate();
      });

      // Opcional: Esto fuerza al Service Worker a verificar actualizaciones de inmediato,
      // útil en entornos donde las verificaciones automáticas no son lo suficientemente rápidas.
      this.swUpdate.checkForUpdate();
    }
  }

  private async promptUpdate(): Promise<void> {
    const message = 'Nueva versión disponible. La página se recargará en 3 segundos...';

    this.toastr.info(message, 'Nueva Versión', {
      timeOut: 3000,
      progressBar: true,
      closeButton: false,
      disableTimeOut: false,
      tapToDismiss: false
    });

    // Escuchar el evento 'controllerchange': se dispara exactamente cuando
    // el nuevo Service Worker toma control de la página. Recargar en ese
    // momento garantiza que el navegador sirva los assets de la versión nueva
    // y evita el race condition de usar un setTimeout fijo.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      }, { once: true });
    }

    // activateUpdate() le indica al SW que salte la cola de espera (skipWaiting)
    // y tome control inmediatamente, lo que dispara el 'controllerchange' de arriba.
    await this.swUpdate.activateUpdate();
  }
}

