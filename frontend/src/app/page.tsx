import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen items-center bg-slate-50 dark:bg-[#0B1220]">
      <div className="mx-auto w-full max-w-xl px-8">
        <div className="flex items-center gap-3">
          <Image src="/icon-transparent.png" alt="" width={200} height={200} />
          <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            StockAura
          </span>
        </div>
        <p className="mt-4 max-w-sm text-base text-slate-500 dark:text-slate-400">
          Inventory and stock management with role-based access control and a full audit trail.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/login"
            className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}