import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Returns { isAdmin, adminData, user, loading }
 *
 * Full admin:  add a doc to `admins/{uid}`  →  adminData.role = 'admin'
 * Blog writer: add a doc to `writers/{uid}` →  adminData.role = 'writer'
 *              Writers can only see the Blog tab in AdminDashboard.
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
        // Check full-admin collection first
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        if (adminSnap.exists()) {
          const data = adminSnap.data();
          setIsAdmin(true);
          setAdminData({
            displayName: data.displayName || user.displayName || user.email,
            role: 'admin',
            ...data,
          });
          return;
        }

        // Check writer collection
        const writerSnap = await getDoc(doc(db, 'writers', user.uid));
        if (writerSnap.exists()) {
          const data = writerSnap.data();
          setIsAdmin(false);
          setAdminData({
            displayName: data.displayName || user.displayName || user.email,
            role: 'writer',
            ...data,
          });
          return;
        }

        // No recognised role
        setIsAdmin(false);
        setAdminData(null);
      } catch (err) {
        console.error('[useAdmin] Error reading role doc:', err.message);
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
