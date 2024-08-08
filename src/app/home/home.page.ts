import { Component, OnInit } from '@angular/core';
import html2canvas from 'html2canvas';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { AlertController, LoadingController, ModalController, Platform, ToastController } from '@ionic/angular';
import { BarcodeScanningModalComponent } from './barcode-scanning-modal.component';
import { LensFacing, BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Clipboard } from '@capacitor/clipboard';
import { Browser } from '@capacitor/browser';


@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  segment = 'scan';
  qrText = '';
  scanResult = '';

  constructor(private loadingController: LoadingController,
    private platform: Platform,
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController) { }

  ngOnInit(): void {
    if (this.platform.is('capacitor')) {
      BarcodeScanner.isSupported().then();
      BarcodeScanner.checkPermissions().then();
      BarcodeScanner.removeAllListeners();
    }
  }

  async startModal() {
    const modal = await this.modalController.create({
      component: BarcodeScanningModalComponent,
      cssClass: 'barcode-scanning-modal',
      showBackdrop: false,
      componentProps: {
        formats: [],
        LensFacing: LensFacing.Back
      }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data) {
      this.scanResult = data?.barcode?.displayValue;
    }
  }

  async readBarcodeFromImage() {
    const { files } = await FilePicker.pickImages();
    const path = files[0]?.path;
    if (!path) return;
    const { barcodes } = await BarcodeScanner.readBarcodesFromImage({
      path,
      formats: []
    });
    this.scanResult = barcodes[0]?.displayValue || '';
  }

  captureScreen() {
    const element = document.getElementById('qrImage') as HTMLElement;

    html2canvas(element).then((canvas: HTMLCanvasElement) => {
      if (this.platform.is('capacitor')) this.shareImage(canvas);
      else this.downloadImage(canvas);
    });
  }

  // Download image (web)
  downloadImage(canvas: HTMLCanvasElement) {
    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = 'qr.png';
    link.click();
  }

  // Share image (mobile)
  async shareImage(canvas: HTMLCanvasElement) {
    const base64 = canvas.toDataURL();
    const path = 'qr.png';

    const loading = await this.loadingController.create({ spinner: 'crescent' });
    await loading.present();

    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
    }).then(async (res) => {
      const uri = res.uri;
      await Share.share({ url: uri });
      await Filesystem.deleteFile({
        path,
        directory: Directory.Cache,
      });
    }).finally(() => {
      loading.dismiss();
    });
  }

  writeToClipboard = async () => {
    await Clipboard.write({
      string: this.scanResult
    });

    const toast = await this.toastController.create({
      message: 'Copied to clipboard',
      duration: 1000,
      color: 'tertiary',
      icon: 'clipboard-outline',
      position: 'middle'
    });
    toast.present();
  }

  isUrl() {
    let regex = /\.(com|net|io|me|crypto|ai|org|gov|gob|ar)\b/i;
    return regex.test(this.scanResult);
  }

  openCapacitorSite = async () => {
    const alert = await this.alertController.create({
      header: 'Confirm!',
      message: 'Do you want to open this link in the browser?',
      mode: 'ios',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        }, {
          text: 'Ok',
          handler: async () => {
            let url = this.scanResult;
            if (!['https://'].includes(this.scanResult)) {
              url = 'https://' + url;
            };
            await Browser.open({ url });
          }
        }
      ]
    });
    await alert.present();
  }

}
