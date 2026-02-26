import { Injectable } from '@angular/core';
import {
    collection,
    collectionData,
    deleteDoc,
    doc,
    Firestore,
    query,
    setDoc,
    updateDoc,
    where,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { BaseModel } from '../../../../models/base/base.model';
import { TestigoModel } from '../../../../models/testigo/testigo.model';
import { environment } from '../../../../../environment';

@Injectable({ providedIn: 'root' })
export class TestigoAsociadoService {
    _collection: string = environment.collections.testigos;

    constructor(private readonly firestore: Firestore) { }

    crearTestigoAsociado(
        data: BaseModel<TestigoModel>
    ): Promise<void> {
        const id = doc(collection(this.firestore, this._collection)).id;
        const dataRef = doc(this.firestore, this._collection, id);
        return setDoc(dataRef, data);
    }

    getTestigosByCoordinador(
        coordinadorId: string
    ): Observable<BaseModel<TestigoModel>[]> {
        const q = query(
            collection(this.firestore, this._collection),
            where('data.uidLider', '==', coordinadorId)
        );
        return collectionData(q, { idField: 'id' }) as Observable<any[]>;
    }

    async deleteTestigoAsociado(id: string) {
        const docRef = doc(this.firestore, `${this._collection}/${id}`);
        await deleteDoc(docRef);
    }

    updateTestigoAsociado(id: string, newData: BaseModel<TestigoModel>) {
        const document = doc(this.firestore, this._collection, id);
        return updateDoc(document, { ...newData });
    }
}
