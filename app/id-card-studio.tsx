'use client';

import Image from 'next/image';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { CardRecord } from '@/db/schema';

type IdCardStudioProps = {
  initialCards: CardRecord[];
};

type FormState = {
  fullName: string;
  employeeId: string;
  department: string;
  roleTitle: string;
  email: string;
  phone: string;
  bloodGroup: string;
  issueDate: string;
  expiryDate: string;
  accentColor: string;
  notes: string;
};

const initialFormState: FormState = {
  fullName: '',
  employeeId: '',
  department: '',
  roleTitle: '',
  email: '',
  phone: '',
  bloodGroup: '',
  issueDate: new Date().toISOString().slice(0, 10),
  expiryDate: '',
  accentColor: '#0f766e',
  notes: '',
};

const statusLabel: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  expired: 'Expired',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

async function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Unable to read image.'));
    };
    reader.onerror = () => reject(reader.error || new Error('Read failed.'));
    reader.readAsDataURL(blob);
  });
}

async function readJsonSafely<T>(response: Response): Promise<T | null> {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  const text = await response.text();

  if (!text.trim()) {
    return null;
  }

  return JSON.parse(text) as T;
}

async function downloadCard(record: CardRecord) {
  const response = await fetch(`/api/cards/${record.id}/photo`);

  if (!response.ok) {
    throw new Error('Unable to load photo for export.');
  }

  const imageBlob = await response.blob();
  const imageUrl = await blobToDataUrl(imageBlob);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1120" height="680" viewBox="0 0 1120 680">
      <defs>
        <linearGradient id="bg" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stop-color="${record.accentColor}" />
          <stop offset="100%" stop-color="#111827" />
        </linearGradient>
      </defs>
      <rect width="1120" height="680" rx="36" fill="url(#bg)" />
      <rect x="36" y="36" width="1048" height="608" rx="28" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />
      <text x="72" y="108" fill="#d1fae5" font-size="30" font-family="Arial, Helvetica, sans-serif" letter-spacing="4">CARDMINT ID STUDIO</text>
      <text x="72" y="176" fill="white" font-size="64" font-weight="700" font-family="Arial, Helvetica, sans-serif">${escapeXml(record.fullName)}</text>
      <text x="72" y="226" fill="#e5e7eb" font-size="30" font-family="Arial, Helvetica, sans-serif">${escapeXml(record.roleTitle)}</text>
      <text x="72" y="278" fill="#a7f3d0" font-size="22" font-family="Arial, Helvetica, sans-serif">EMPLOYEE ID</text>
      <text x="72" y="312" fill="white" font-size="36" font-family="Arial, Helvetica, sans-serif">${escapeXml(record.employeeId)}</text>
      <text x="72" y="376" fill="#a7f3d0" font-size="22" font-family="Arial, Helvetica, sans-serif">DEPARTMENT</text>
      <text x="72" y="410" fill="white" font-size="32" font-family="Arial, Helvetica, sans-serif">${escapeXml(record.department)}</text>
      <text x="72" y="470" fill="#a7f3d0" font-size="22" font-family="Arial, Helvetica, sans-serif">VALID THROUGH</text>
      <text x="72" y="504" fill="white" font-size="32" font-family="Arial, Helvetica, sans-serif">${escapeXml(formatDate(record.expiryDate))}</text>
      <text x="72" y="566" fill="#d1d5db" font-size="20" font-family="Arial, Helvetica, sans-serif">${escapeXml(record.email)}</text>
      <text x="72" y="598" fill="#d1d5db" font-size="20" font-family="Arial, Helvetica, sans-serif">${escapeXml(record.phone)}</text>
      <rect x="830" y="88" width="208" height="250" rx="24" fill="white" />
      <image x="844" y="102" width="180" height="222" href="${imageUrl}" preserveAspectRatio="xMidYMid slice" />
      <rect x="830" y="390" width="208" height="166" rx="24" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.14)" />
      <text x="860" y="446" fill="#a7f3d0" font-size="19" font-family="Arial, Helvetica, sans-serif">STATUS</text>
      <text x="860" y="480" fill="white" font-size="28" font-family="Arial, Helvetica, sans-serif">${escapeXml(statusLabel[record.status] || record.status)}</text>
      <text x="860" y="526" fill="#a7f3d0" font-size="19" font-family="Arial, Helvetica, sans-serif">ISSUED</text>
      <text x="860" y="558" fill="white" font-size="24" font-family="Arial, Helvetica, sans-serif">${escapeXml(formatDate(record.issueDate))}</text>
    </svg>
  `.trim();

  const canvas = document.createElement('canvas');
  canvas.width = 1120;
  canvas.height = 680;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas is unavailable in this browser.');
  }

  const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const objectUrl = URL.createObjectURL(svgBlob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Unable to render card image.'));
      img.src = objectUrl;
    });

    ctx.drawImage(image, 0, 0);

    const downloadUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${record.employeeId || 'id-card'}.png`;
    link.click();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function IdCardStudio({ initialCards }: IdCardStudioProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mountedAt] = useState(() => Date.now());
  const [formState, setFormState] = useState(initialFormState);
  const [photo, setPhoto] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const filteredCards = useMemo(() => {
    const term = search.trim().toLowerCase();

    return initialCards.filter((card) => {
      const matchesSearch =
        !term ||
        [
          card.fullName,
          card.employeeId,
          card.department,
          card.roleTitle,
          card.email,
        ].some((field) => field.toLowerCase().includes(term));
      const matchesStatus =
        statusFilter === 'all' ? true : card.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [initialCards, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: initialCards.length,
      active: initialCards.filter((card) => card.status === 'active').length,
      inactive: initialCards.filter((card) => card.status === 'inactive').length,
      expiringSoon: initialCards.filter((card) => {
        const expiry = new Date(card.expiryDate).getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;

        return expiry >= mountedAt && expiry <= mountedAt + thirtyDays;
      }).length,
    }),
    [initialCards, mountedAt],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!photo) {
      setNotice('Add a profile photo before issuing a card.');
      return;
    }

    setSubmitting(true);
    setNotice(null);

    try {
      const payload = new FormData();
      Object.entries(formState).forEach(([key, value]) => payload.append(key, value));
      payload.append('photo', photo);

      const response = await fetch('/api/cards', {
        method: 'POST',
        body: payload,
      });
      const json = await readJsonSafely<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(
          json?.error ||
            'Unable to issue the card. The server returned an unexpected response.',
        );
      }

      setFormState(initialFormState);
      setPhoto(null);
      setNotice('ID card issued successfully.');
      startTransition(() => router.refresh());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to issue the card.';
      setNotice(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: string, status: string) {
    setNotice(null);

    try {
      const response = await fetch(`/api/cards/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      const json = await readJsonSafely<{ error?: string }>(response);

      if (!response.ok) {
        throw new Error(
          json?.error ||
            'Unable to update status. The server returned an unexpected response.',
        );
      }

      startTransition(() => router.refresh());
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : 'Unable to update status.',
      );
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.22),_transparent_32%),linear-gradient(180deg,_#f7f5f0_0%,_#f2efe8_48%,_#ebe7df_100%)] px-4 py-6 text-slate-950 sm:px-6 lg:px-10">
      <section className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="overflow-hidden rounded-[32px] border border-white/60 bg-[#101826] px-6 py-8 text-white shadow-[0_30px_80px_rgba(16,24,38,0.18)] sm:px-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                Deployable digital ID management
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                CardMint ID Studio
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Issue employee cards, keep records in one place, store profile
                photos safely, and download polished digital IDs without
                leaving the dashboard.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard label="Total cards" value={String(stats.total)} />
              <MetricCard label="Active" value={String(stats.active)} />
              <MetricCard
                label="Expiring in 30 days"
                value={String(stats.expiringSoon)}
              />
            </div>
          </div>
        </header>

        {notice ? (
          <div className="rounded-2xl border border-emerald-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm">
            {notice}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
          <form
            onSubmit={handleSubmit}
            className="rounded-[28px] border border-stone-200/80 bg-white/85 p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  New issuance
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Create digital ID
                </h2>
              </div>
              <div
                className="h-12 w-12 rounded-2xl border border-emerald-200"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(15,118,110,0.16), rgba(17,24,39,0.08))',
                }}
              />
            </div>

            <div className="grid gap-4">
              <Field label="Full name">
                <input
                  required
                  value={formState.fullName}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  className="field"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Employee ID">
                  <input
                    required
                    value={formState.employeeId}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        employeeId: event.target.value,
                      }))
                    }
                    className="field"
                  />
                </Field>
                <Field label="Department">
                  <input
                    required
                    value={formState.department}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        department: event.target.value,
                      }))
                    }
                    className="field"
                  />
                </Field>
              </div>

              <Field label="Role / designation">
                <input
                  required
                  value={formState.roleTitle}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      roleTitle: event.target.value,
                    }))
                  }
                  className="field"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email">
                  <input
                    required
                    type="email"
                    value={formState.email}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="field"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    required
                    value={formState.phone}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="field"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Blood group">
                  <input
                    value={formState.bloodGroup}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        bloodGroup: event.target.value,
                      }))
                    }
                    className="field"
                  />
                </Field>
                <Field label="Issue date">
                  <input
                    required
                    type="date"
                    value={formState.issueDate}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        issueDate: event.target.value,
                      }))
                    }
                    className="field"
                  />
                </Field>
                <Field label="Expiry date">
                  <input
                    required
                    type="date"
                    value={formState.expiryDate}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        expiryDate: event.target.value,
                      }))
                    }
                    className="field"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
                <Field label="Notes">
                  <textarea
                    rows={3}
                    value={formState.notes}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    className="field min-h-[88px] resize-y"
                  />
                </Field>
                <Field label="Accent">
                  <input
                    type="color"
                    value={formState.accentColor}
                    onChange={(event) =>
                      setFormState((current) => ({
                        ...current,
                        accentColor: event.target.value,
                      }))
                    }
                    className="h-[52px] w-full rounded-2xl border border-stone-200 bg-white p-2"
                  />
                </Field>
              </div>

              <Field label="Profile photo">
                <input
                  required
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setPhoto(event.target.files?.[0] ?? null)
                  }
                  className="field file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={submitting || isPending}
              className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {submitting ? 'Issuing card...' : 'Issue ID card'}
            </button>
          </form>

          <section className="rounded-[28px] border border-stone-200/80 bg-white/82 p-5 shadow-[0_20px_55px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Card directory
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  Manage issued IDs
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  placeholder="Search name, employee ID, team..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="field min-w-[240px]"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="field min-w-[150px]"
                >
                  <option value="all">All statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {filteredCards.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-6 py-12 text-center text-sm text-stone-500">
                  No ID cards match this view yet.
                </div>
              ) : null}

              {filteredCards.map((card) => (
                <article
                  key={card.id}
                  className="grid gap-4 rounded-[26px] border border-stone-200 bg-[#fffdf9] p-4 shadow-sm xl:grid-cols-[330px_minmax(0,1fr)]"
                >
                  <div
                    className="relative overflow-hidden rounded-[24px] p-5 text-white"
                    style={{
                      background: `linear-gradient(135deg, ${card.accentColor}, #111827)`,
                    }}
                  >
                    <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-100">
                      {statusLabel[card.status] || card.status}
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100">
                      CardMint digital ID
                    </p>
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                      {card.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-200">{card.roleTitle}</p>
                    <div className="mt-6 grid grid-cols-[90px_1fr] items-start gap-4">
                      <Image
                        src={`/api/cards/${card.id}/photo`}
                        alt={card.fullName}
                        width={90}
                        height={110}
                        unoptimized
                        className="h-[110px] w-[90px] rounded-[18px] border border-white/20 object-cover"
                      />
                      <dl className="grid gap-2 text-sm">
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.18em] text-emerald-100/80">
                            Employee ID
                          </dt>
                          <dd className="mt-1 font-medium">{card.employeeId}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.18em] text-emerald-100/80">
                            Department
                          </dt>
                          <dd className="mt-1 font-medium">{card.department}</dd>
                        </div>
                        <div>
                          <dt className="text-[10px] uppercase tracking-[0.18em] text-emerald-100/80">
                            Valid through
                          </dt>
                          <dd className="mt-1 font-medium">
                            {formatDate(card.expiryDate)}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between gap-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Detail label="Email" value={card.email} />
                      <Detail label="Phone" value={card.phone} />
                      <Detail label="Issue date" value={formatDate(card.issueDate)} />
                      <Detail label="Blood group" value={card.bloodGroup || 'Not set'} />
                    </div>

                    {card.notes ? (
                      <div className="rounded-2xl bg-stone-100 px-4 py-3 text-sm leading-6 text-stone-700">
                        {card.notes}
                      </div>
                    ) : null}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex gap-2">
                        {['active', 'inactive', 'expired'].map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => handleStatusChange(card.id, status)}
                            disabled={isPending}
                            className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                              card.status === status
                                ? 'bg-slate-950 text-white'
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                          >
                            {statusLabel[status]}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          downloadCard(card).catch((error: unknown) => {
                            setNotice(
                              error instanceof Error
                                ? error.message
                                : 'Unable to export the card.',
                            );
                          })
                        }
                        className="rounded-2xl border border-stone-300 px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-800 hover:bg-slate-50"
                      >
                        Download PNG
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white/8 px-4 py-4 backdrop-blur">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}
