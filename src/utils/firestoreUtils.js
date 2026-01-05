import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';

// Trip operations
export const createTrip = async (tripData) => {
  try {
    const docRef = await addDoc(collection(db, 'trips'), {
      ...tripData,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
};

export const getTrip = async (tripId) => {
  try {
    const docRef = doc(db, 'trips', tripId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting trip:', error);
    throw error;
  }
};

export const getTripsByDate = async (date) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const q = query(
      collection(db, 'trips'),
      where('date', '>=', Timestamp.fromDate(startOfDay)),
      where('date', '<=', Timestamp.fromDate(endOfDay))
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting trips by date:', error);
    throw error;
  }
};

export const updateTrip = async (tripId, updates) => {
  try {
    const docRef = doc(db, 'trips', tripId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
};

export const deleteTrip = async (tripId) => {
  try {
    await deleteDoc(doc(db, 'trips', tripId));
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
};

// Registration operations
export const createRegistration = async (registrationData) => {
  try {
    const docRef = await addDoc(collection(db, 'registrations'), {
      ...registrationData,
      timestamp: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating registration:', error);
    throw error;
  }
};

export const getRegistrationsByTrip = async (tripId) => {
  try {
    const q = query(
      collection(db, 'registrations'),
      where('tripId', '==', tripId)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting registrations:', error);
    throw error;
  }
};

export const updateRegistration = async (registrationId, updates) => {
  try {
    const docRef = doc(db, 'registrations', registrationId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error('Error updating registration:', error);
    throw error;
  }
};

export const deleteRegistration = async (registrationId) => {
  try {
    await deleteDoc(doc(db, 'registrations', registrationId));
  } catch (error) {
    console.error('Error deleting registration:', error);
    throw error;
  }
};
