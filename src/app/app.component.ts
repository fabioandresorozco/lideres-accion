import { HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { ToastrService } from 'ngx-toastr';

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
  ) { }

  ngOnInit(): void {
    // 1. Verificar que el Service Worker esté habilitado
    if (this.swUpdate.isEnabled) {

      // 2. Suscribirse al evento 'available'
      this.swUpdate.versionUpdates.subscribe((event: VersionEvent) => {

        // El evento VersionReadyEvent (parte de VersionEvent) es cuando la nueva versión está lista.
        if (event.type === 'VERSION_READY') {
          // 3. Notificar al usuario y forzar la actualización
          this.promptUpdate();
        }
      });

      // Opcional: Esto fuerza al Service Worker a verificar actualizaciones de inmediato,
      // útil en entornos donde las verificaciones automáticas no son lo suficientemente rápidas.
      this.swUpdate.checkForUpdate();
    }
  }

  private promptUpdate(): void {
    const message = 'Actualizando aplicación a la nueva versión...';

    this.toastr.info(message, 'Actualización Obligatoria', {
      timeOut: 2000,
      progressBar: true,
      closeButton: false, // Prevent closing
      disableTimeOut: false,
      tapToDismiss: false // Prevent dismissing
    });

    // Wait 3 seconds for the user to read the message, then force update
    setTimeout(() => {
      this.swUpdate.activateUpdate().then(() => document.location.reload());
    }, 3000);
  }
}

