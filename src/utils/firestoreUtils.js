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

export const publishTrip = async (tripId) => {
  await updateDoc(doc(db, 'trips', tripId), {
    status: 'planned',
    showOnWebsite: true,
  });
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

// Question operations
export const createQuestion = async (data) => {
  try {
    const docRef = await addDoc(collection(db, 'questions'), {
      ...data,
      read: false,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

export const getAllQuestions = async () => {
  try {
    const snapshot = await getDocs(collection(db, 'questions'));
    return snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  } catch (error) {
    console.error('Error getting questions:', error);
    return [];
  }
};

export const markQuestionRead = async (questionId) => {
  try {
    await updateDoc(doc(db, 'questions', questionId), { read: true });
  } catch (error) {
    console.error('Error marking question as read:', error);
  }
};

// Feedback showcase — mark/unmark a feedback to appear on the landing page
export const toggleFeedbackWebsite = async (id, show) => {
  await updateDoc(doc(db, 'feedbacks', id), { showOnWebsite: show });
};

// Fetch feedbacks approved to show on the landing page
export const getWebsiteFeedbacks = async () => {
  const snap = await getDocs(query(collection(db, 'feedbacks'), where('showOnWebsite', '==', true)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

// Site settings (single doc: siteSettings/config)
export const getSiteSettings = async () => {
  const snap = await getDoc(doc(db, 'siteSettings', 'config'));
  return snap.exists() ? snap.data() : {};
};

export const updateSiteSettings = async (settings) => {
  await setDoc(doc(db, 'siteSettings', 'config'), settings, { merge: true });
};

// ─── Blog Post operations ────────────────────────────────────────────────────

export const createBlogPost = async (postData) => {
  const docRef = await addDoc(collection(db, 'blogPosts'), {
    ...postData,
    createdAt: Timestamp.now(),
    publishedAt: postData.published ? Timestamp.now() : null,
  });
  return docRef.id;
};

export const getAllBlogPosts = async () => {
  const snap = await getDocs(collection(db, 'blogPosts'));
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
};

export const getPublishedBlogPosts = async () => {
  const q = query(collection(db, 'blogPosts'), where('published', '==', true));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.publishedAt?.seconds || b.createdAt?.seconds || 0) - (a.publishedAt?.seconds || a.createdAt?.seconds || 0));
};

export const updateBlogPost = async (postId, updates) => {
  await updateDoc(doc(db, 'blogPosts', postId), updates);
};

export const deleteBlogPost = async (postId) => {
  await deleteDoc(doc(db, 'blogPosts', postId));
};

// ─── Blog Comment operations ─────────────────────────────────────────────────

export const createBlogComment = async (commentData) => {
  const docRef = await addDoc(collection(db, 'blogComments'), {
    ...commentData,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const getApprovedBlogComments = async (postId) => {
  const q = query(
    collection(db, 'blogComments'),
    where('postId', '==', postId),
    where('approved', '==', true)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
};

export const getPendingBlogComments = async () => {
  const q = query(collection(db, 'blogComments'), where('approved', '==', false));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
};

export const approveBlogComment = async (commentId) => {
  await updateDoc(doc(db, 'blogComments', commentId), { approved: true });
};

export const deleteBlogComment = async (commentId) => {
  await deleteDoc(doc(db, 'blogComments', commentId));
};
