import { BaseModel } from '../../../../models/base/base.model';
import { Injectable } from '@angular/core';
import {
    collection,
    collectionData,
    deleteDoc,
    doc,
    Firestore,
    getDoc,
    query,
    setDoc,
    updateDoc,
    where,
    orderBy,
    limit,
    getDocs,
    addDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environment';
import { CuentavotosModel } from '../../../../models/cuentavotos/cuentavotos.model';

@Injectable({ providedIn: 'root' })
export class CuentavotosService {
    _collection: string = environment.collections.cuentavotos;

    constructor(private readonly firestore: Firestore) { }

    /**
     * Crear un nuevo registro de cuentavotos
     * @param data - Datos del conteo de votos
     * @returns Promise<void>
     */
    async crearCuentavotos(data: BaseModel<CuentavotosModel>): Promise<string> {
        const colRef = collection(this.firestore, this._collection);
        const docRef = await addDoc(colRef, data);
        return docRef.id;
    }

    /**
     * Obtener todos los cuentavotos reportados por un testigo específico
     * @param reportadoPor - Documento del testigo
     * @returns Observable con los registros
     */
    getCuentavotosByReportadoPor(
        reportadoPor: string
    ): Observable<BaseModel<CuentavotosModel>[]> {
        const q = query(
            collection(this.firestore, this._collection),
            where('data.reportadoPor', '==', reportadoPor)
        );
        return collectionData(q, { idField: 'id' }) as Observable<
            BaseModel<CuentavotosModel>[]
        >;
    }

    /**
     * Obtener cuentavotos por puesto y mesa de votación
     * @param puesto - Puesto de votación
     * @param mesa - Mesa de votación
     * @returns Observable con los registros
     */
    getCuentavotosByPuestoYMesa(
        puestoVotacionId: string,
        mesaVotacion: number
    ): Observable<BaseModel<CuentavotosModel>[]> {
        const q = query(
            collection(this.firestore, this._collection),
            where('data.puestoVotacionId', '==', puestoVotacionId),
            where('data.mesaVotacion', '==', mesaVotacion)
        );
        return collectionData(q, { idField: 'id' }) as Observable<
            BaseModel<CuentavotosModel>[]
        >;
    }

    /**
     * Obtener cuentavotos por puesto de votación
     * @param puestoVotacionId - ID del puesto de votación
     * @returns Observable con los registros
     */
    getCuentavotosByPuesto(
        puestoVotacionId: string
    ): Observable<BaseModel<CuentavotosModel>[]> {
        const q = query(
            collection(this.firestore, this._collection),
            where('data.puestoVotacionId', '==', puestoVotacionId)
        );
        return collectionData(q, { idField: 'id' }) as Observable<
            BaseModel<CuentavotosModel>[]
        >;
    }

    /**
     * Obtener todos los cuentavotos
     * @returns Observable con todos los registros
     */
    getAllCuentavotos(): Observable<BaseModel<CuentavotosModel>[]> {
        const _collection = collection(this.firestore, this._collection);
        return collectionData(_collection, { idField: 'id' }) as Observable<
            BaseModel<CuentavotosModel>[]
        >;
    }

    /**
     * Obtener un cuentavotos por ID
     * @param id - ID del documento
     * @returns Promise con el registro
     */
    getCuentavotosById(id: string): Promise<BaseModel<CuentavotosModel>> {
        const docRef = doc(this.firestore, this._collection, id);
        return getDoc(docRef).then((docSnap) => {
            if (docSnap.exists()) {
                return docSnap.data() as BaseModel<CuentavotosModel>;
            } else {
                throw new Error('No existe o permisos insuficientes');
            }
        });
    }

    /**
     * Actualizar un cuentavotos
     * @param id - ID del documento
     * @param newData - Nuevos datos
     * @returns Promise<void>
     */
    updateCuentavotos(
        id: string,
        newData: BaseModel<CuentavotosModel>
    ): Promise<void> {
        const document = doc(this.firestore, this._collection, id);
        return updateDoc(document, { ...newData });
    }

    /**
     * Eliminar un cuentavotos
     * @param id - ID del documento
     * @returns Promise<void>
     */
    async deleteCuentavotos(id: string): Promise<void> {
        const docRef = doc(this.firestore, `${this._collection}/${id}`);
        await deleteDoc(docRef);
    }
}
