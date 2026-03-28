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
  setDoc,
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

export const getAllTrips = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'trips'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all trips:', error);
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
      where('startDateTime', '>=', Timestamp.fromDate(startOfDay)),
      where('startDateTime', '<=', Timestamp.fromDate(endOfDay))
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

// Companion token — generates (once) and persists a UUID on a registration doc.
// Returns the token string so the caller can build the magic link URL.
export const ensureCompanionToken = async (registrationId) => {
  const docRef = doc(db, 'registrations', registrationId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  const existing = snap.data().companionToken;
  if (existing) return existing;
  const token = crypto.randomUUID();
  await updateDoc(docRef, { companionToken: token });
  return token;
};

// Contact operations
export const getAllContacts = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'contacts'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting contacts:', error);
    return [];
  }
};

export const upsertContact = async ({ firstName, lastName, email, phone, preferredPickupPlace }) => {
  if (!email) return;
  try {
    const emailKey = email.toLowerCase().replace(/[.#$[\]/]/g, '_');
    const ref = doc(db, 'contacts', emailKey);
    await setDoc(ref, { firstName, lastName, email, phone, preferredPickupPlace: preferredPickupPlace || '', updatedAt: Timestamp.now() }, { merge: true });
  } catch (error) {
    console.error('Error upserting contact:', error);
  }
};

// Feedback operations

export const createFeedback = async ({ token, ...data }) => {
  const ref = doc(db, 'feedbacks', token);
  const existing = await getDoc(ref);
  if (existing.exists()) throw new Error('already_submitted');
  await setDoc(ref, { ...data, submittedAt: Timestamp.now() });
};

export const getFeedbackByTrip = async (tripId) => {
  try {
    const snap = await getDocs(query(collection(db, 'feedbacks'), where('tripId', '==', tripId)));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting feedbacks:', error);
    return [];
  }
};

export const getFeedbackByToken = async (token) => {
  try {
    const snap = await getDoc(doc(db, 'feedbacks', token));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.error('Error getting feedback by token:', error);
    return null;
  }
};
