'use client';
import { useEffect } from 'react';

export default function Toast({ msg, onClose }: { msg: string | null; onClose: () => void }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className="fixed left-1/2 top-4 z-50 w-[92%] max-w-sm -translate-x-1/2 rounded-2xl bg-brand-900 px-4 py-3 text-sm font-semibold text-white shadow-xl" role="status">
      {msg}
    </div>
  );
}
