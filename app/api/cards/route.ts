import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createCard } from '@/db/cards';
import { uploadPhoto } from '@/lib/storage';

const MAX_FILE_SIZE = 3 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const photo = formData.get('photo');

    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json(
        { error: 'A profile photo is required.' },
        { status: 400 },
      );
    }

    if (photo.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Photo must be 3 MB or smaller.' },
        { status: 400 },
      );
    }

    if (!photo.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Photo must be an image file.' },
        { status: 400 },
      );
    }

    const id = randomUUID();
    const now = Date.now();
    const safeName = (photo.name || 'photo')
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const photoKey = `cards/${id}/${safeName}`;

    await uploadPhoto(photoKey, photo);

    await createCard({
      id,
      fullName: String(formData.get('fullName') || '').trim(),
      employeeId: String(formData.get('employeeId') || '').trim(),
      department: String(formData.get('department') || '').trim(),
      roleTitle: String(formData.get('roleTitle') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      bloodGroup: String(formData.get('bloodGroup') || '').trim() || null,
      issueDate: String(formData.get('issueDate') || '').trim(),
      expiryDate: String(formData.get('expiryDate') || '').trim(),
      status: 'active',
      accentColor:
        String(formData.get('accentColor') || '').trim() || '#0f766e',
      notes: String(formData.get('notes') || '').trim() || null,
      photoKey,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error('Unable to create card.', error);
    return NextResponse.json(
      {
        error:
          'Unable to create the card right now. Check Netlify Blobs configuration and retry.',
      },
      { status: 500 },
    );
  }
}
