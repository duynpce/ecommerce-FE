export const UI_CLASS_NAME = {
  pageWrapper:
    'min-h-screen bg-slate-100 px-4 py-10 text-slate-900 sm:px-6 lg:px-8',
  card:
    'mx-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-200 sm:p-8',
  sectionTitle: 'text-2xl font-bold tracking-tight text-slate-900',
  sectionDescription: 'mt-2 text-sm text-slate-600',
  formGrid: 'mt-6 grid gap-4 sm:grid-cols-2',
  fullWidth: 'sm:col-span-2',
  label: 'mb-1 block text-sm font-medium text-slate-700',
  input:
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200',
  select:
    'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200',
  errorText: 'mt-1 text-xs font-medium text-red-600',
  helperText: 'mt-1 text-xs text-slate-500',
  dangerText: 'mt-1 text-xs font-medium text-amber-600',
  successText: 'mt-4 text-sm font-medium text-emerald-600',
  buttonPrimary:
    'inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50',
  buttonSecondary:
    'inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50',
  buttonDanger:
    'inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50',
  center: 'flex items-center justify-center',
} as const;
