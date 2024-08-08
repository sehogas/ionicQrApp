import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { QrCodeModule } from 'ng-qrcode';

import { HomePage } from './home.page';

import { HomePageRoutingModule } from './home-routing.module';
import { BarcodeScanningModalComponent } from './barcode-scanning-modal.component';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    QrCodeModule,
    HomePageRoutingModule,
  ],
  declarations: [HomePage, BarcodeScanningModalComponent]
})
export class HomePageModule {}
