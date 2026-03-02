import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IconButtonComponent } from '../icon-button/icon-button.component';

@Component({
    selector: 'mg-icon-whatsapp',
    templateUrl: './icon-whatsapp.component.html',
    standalone: true,
    imports: [CommonModule, IconButtonComponent],
})
export class IconWhatsappComponent {
    @Input() phone!: string;
    @Input() message?: string;
    @Input() size: 'small' | 'medium' | 'large' = 'medium';

    get whatsappLink(): string {
        const baseUrl = 'https://wa.me/';
        const cleanPhone = this.phone?.replace(/[^0-9]/g, '');
        let url = `${baseUrl}+57${cleanPhone}`;

        if (this.message) {
            url += `?text=${encodeURIComponent(this.message)}`;
        }

        return url;
    }
}
