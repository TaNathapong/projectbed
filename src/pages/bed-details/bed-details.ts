import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController } from 'ionic-angular';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase';

@IonicPage()
@Component({
    selector: 'page-bed-details',
    templateUrl: 'bed-details.html',
})

export class BedDetailsPage {
    bedsData = [];
    profileData = {};

    constructor(public navCtrl: NavController, public navParams: NavParams, private afDB: AngularFireDatabase, private alertCtrl: AlertController, private afAuth: AngularFireAuth) {
        this.afAuth.authState.subscribe(data => {
            if (data && data.email && data.uid) {
                this.afDB.list("/wards/").valueChanges().subscribe(_data => {
                    this.bedsData = _data;
                });
                this.afDB.object(`profiles/${data.uid}`).valueChanges().subscribe(_data => {
                    this.profileData = _data;
                });
            }
        });
    }

    ionViewDidLoad() {
        console.log('ionViewDidLoad BedDetailsPage');
    }

    updateBed(bed) {
        let prompt = this.alertCtrl.create({
            title: `วอร์ดที่ ${bed.id}`,
            message: "กรอกจำนวนเตียงที่ว่าง",
            inputs: [
                {
                    name: 'blank',
                    placeholder: 'จำนวนเตียงที่ว่าง',
                    type: 'number'
                },
            ],
            buttons: [
                {
                    text: 'ยกเลิก',
                    role: 'cancel',
                    handler: data => {
                        console.log('Cancel clicked');
                    }
                }, {
                    text: 'ยืนยัน',
                    handler: data => {
                        if (data.blank != '') {
                            this.afDB.list('/updateLogs/').push({
                                type: 'อัปเดต',
                                detail: `อัปเดตจากวอร์ด ${bed.name} จากเดิม ${bed.blank} เป็น ${data.blank}`,
                                ward: bed.name,
                                before: bed.blank,
                                after: data.blank,
                                timestamp: firebase.database.ServerValue.TIMESTAMP
                            });
                            this.afDB.object('/wards/' + bed.id).update({
                                blank: data.blank,
                                time: firebase.database.ServerValue.TIMESTAMP
                            });
                            let alert = this.alertCtrl.create({
                                title: 'บันทึกข้อมูลสำเร็จ',
                                subTitle: 'อัพเดทจำนวนเตียงว่างเสร็จสิ้น',
                                buttons: ['OK']
                            });
                            alert.present();
                            console.log('Save complete');
                        } else {
                            let alert = this.alertCtrl.create({
                                title: 'รายการไม่ถูกต้อง!',
                                subTitle: 'กรุณากรอกจำนวนเตียง',
                                buttons: ['OK']
                            });
                            alert.present();
                        }
                    }
                }
            ]
        });
        prompt.present();
    }

    addPatient(bed) {
        if (bed.blank > 0) {
            this.afDB.list('/updateLogs/').push({
                type: 'นำผู้ป่วยเข้า',
                detail: `เพิ่มผู้ป่วยเข้าสู่วอร์ด ${bed.name} จากเดิม ${bed.blank} เป็น ${bed.blank - 1}`,
                ward: bed.name,
                before: bed.blank,
                after: bed.blank - 1,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });

            let confirm = this.alertCtrl.create({
                title: `ยืนยันการเพิ่มผู้ป่วยเข้า ?`,
                message: `คุณต้องการยืนยันการเพิ่มผู้ป่วยเข้าสู่วอร์ด ${bed.name}`,
                buttons: [
                    {
                        text: 'ยกเลิก',
                        handler: () => {
                            console.log('Cancel');
                        }
                    },
                    {
                        text: 'ยืนยัน',

                        handler: () => {
                            this.afDB.object('/wards/' + bed.id).update({
                                blank: bed.blank - 1,
                                time: firebase.database.ServerValue.TIMESTAMP
                            });
                            let alert = this.alertCtrl.create({
                                title: 'บันทึกข้อมูลสำเร็จ',
                                subTitle: 'อัพเดทจำนวนเตียงว่างเสร็จสิ้น',
                                buttons: ['OK']
                            });
                            alert.present();
                            console.log('Save complete');
                        }
                    }
                ]
            });
            confirm.present();
        }
        else {
            let alert = this.alertCtrl.create({
                title: 'รายการไม่ถูกต้อง !',
                subTitle: `ไม่สามารถเพิ่มผู้ป่วยเข้าสู่วอร์ด ${bed.name} ได้เนื่องจากไม่มีเตียงผู้ป่วยที่ว่างในขณะนี้`,
                buttons: ['OK']
            });
            alert.present();
        }
    }

    removePatient(bed) {
        this.afDB.list('/updateLogs/').push({
            type: 'ลดผู้ป่วยออก',
            detail: `ลดผู้ป่วยออกจากวอร์ด ${bed.name} จากเดิม ${bed.blank} เป็น ${bed.blank + 1}`,
            ward: bed.name,
            before: bed.blank,
            after: bed.blank + 1,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        let confirm = this.alertCtrl.create({
            title: `ยืนยันการลดผู้ป่วยออก ?`,
            message: `คุณต้องการยืนยันการลดผู้ป่วยออกจากวอร์ด ${bed.name}`,
            buttons: [
                {
                    text: 'ยกเลิก',
                    handler: () => {
                        console.log('Cancel');
                    }
                },
                {
                    text: 'ยืนยัน',

                    handler: () => {
                        this.afDB.object('/wards/' + bed.id)
                            .update({
                                blank: bed.blank + 1,
                                time: firebase.database.ServerValue.TIMESTAMP
                            });
                        let alert = this.alertCtrl.create({
                            title: 'รายการสำเร็จ',
                            subTitle: 'อัพเดทจำนวนเตียงว่างเสร็จสิ้น',
                            buttons: ['OK']
                        });
                        alert.present();
                        console.log('Save complete');
                    }
                }
            ]
        });
        confirm.present();
    }
}
