import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Returns { isAdmin, adminData, loading }
 * adminData = { displayName, email, ... } from admins/{uid} in Firestore
 *
 * To grant admin access: add a document to the `admins` Firestore collection
 * with the document ID = the user's Firebase UID, e.g.:
 *   admins/aBcDeFgH123  →  { displayName: "Bar", email: "bar@example.com" }
 */
const useAdmin = () => {
  const [user, authLoading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsAdmin(false);
      setAdminData(null);
      setLoading(false);
      return;
    }

    const check = async () => {
      try {
        const snap = await getDoc(doc(db, 'admins', user.uid));
        console.log('[useAdmin] uid:', user.uid, '| doc exists:', snap.exists(), '| data:', snap.data());
        if (snap.exists()) {
          const data = snap.data();
          setIsAdmin(true);
          setAdminData({
            displayName: data.displayName || user.displayName || user.email,
            ...data,
          });
        } else {
          console.warn('[useAdmin] No admin doc found for uid:', user.uid);
          setIsAdmin(false);
          setAdminData(null);
        }
      } catch (err) {
        console.error('[useAdmin] Error reading admin doc:', err.message);
        setIsAdmin(false);
        setAdminData(null);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [user, authLoading]);

  return { isAdmin, adminData, user, loading };
};

export default useAdmin;
