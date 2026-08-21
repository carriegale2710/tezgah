---
name: saas-storage
description: >
  Set up a file storage infrastructure with Supabase Storage for a SaaS
  application. Bucket configuration, file security with RLS, file uploads,
  image optimisation, and plan-based storage limits. Use this skill when
  the user wants anything related to file uploads, images, storage, or
  profile photos. Phrases like "add file upload", "upload a profile photo",
  "set up storage" trigger this skill.
---

# SaaS Storage — File Storage with Supabase Storage

This skill sets up the file storage layer for a SaaS application using Supabase Storage. Profile photos, user-uploaded documents, product images, or exported reports — file storage is a required layer in most SaaS products.

Supabase Storage is part of the same Supabase project you're already using for the database — no extra service account or configuration required. It provides file-level security via RLS, built-in image transformation, and visual file management in the Dashboard. Free tier: 1 GB storage, 2 GB bandwidth/month.

**Dependency:** This skill is an optional phase of the **saas-launcher** orchestrator skill. It can also be used independently. Not every SaaS needs it — only implement when file upload is required.

**Related skills:**
- **saas-database** — File metadata (name, size, type, URL) is stored in the database. Supabase Storage is part of the same project.
- **saas-auth** — File access is tied to user identity.
- **saas-api-security** — Upload endpoints require input validation and rate limiting.

---

## Supabase Storage Setup

### Creating Buckets

Files in Supabase Storage are organised in buckets. Each bucket is like a folder.

Recommended bucket structure:
- `avatars` — User profile photos (public)
- `uploads` — User files (private — must be protected with RLS)
- `exports` — System-generated files (private)

**Public vs. Private bucket:**
- Public: Anyone can access with the file URL. For profile photos, product images.
- Private: Access is subject to RLS policies. For user documents, sensitive files.

### RLS Policies

Storage buckets are protected with RLS just like database tables:

- **Profile photo upload:** The user should only be able to upload to their own folder (`avatars/{user_id}/`)
- **File reading:** The user should only be able to see their own files
- **File deletion:** The user should only be able to delete their own files

Combine folder structure with RLS: `{bucket}/{user_id}/{file}` — this way path verification can be done with `auth.uid()`.

---

## File Upload Architecture

### Client-Side Upload (Small Files)

Direct upload from the browser using the Supabase Storage client:
1. User selects a file
2. Client-side validation (type, size)
3. Direct upload to the Supabase Storage API
4. Save the URL to the database

**Advantage:** Simple, no server load.
**Limit:** Default maximum file size in the Supabase client is 5 MB (configurable).

### Presigned URL Upload (Large Files)

For large files, generate a presigned URL via the server:
1. Client → sends upload request to server (file name, type, size)
2. Server performs validation, generates a presigned upload URL
3. Client → uploads directly to the presigned URL
4. Server → verifies upload is complete, saves metadata to the database

**Advantage:** Server doesn't transport file content, saving bandwidth. Large files are supported.

---

## File Security

### Input Validation

Perform these checks on file uploads:

1. **File type check:** Define allowed MIME types. Only accept expected types.
   - Profile photo: `image/jpeg`, `image/png`, `image/webp`
   - Document: `application/pdf`, `text/plain`
   - **Don't do:** Allow `*/*` or all types

2. **File size check:** Define a maximum size.
   - Profile photo: 5 MB
   - Document: 10–50 MB
   - **Don't do:** Allow unlimited uploads — storage cost and DDoS risk

3. **File name sanitisation:** Don't trust the file name sent by the user. Rename with a UUID. Store the original name as metadata.

4. **Magic bytes check (advanced):** The MIME type header can be manipulated. Verify the real type by checking the first bytes (magic bytes) of the file.

### Rate Limiting

Apply rate limiting to the upload endpoint:
- 10 uploads per minute per user
- Daily total size limit per user (plan-based)

### Malicious Content

- Process uploaded images (resize/compress) — this step strips embedded malicious code
- When serving documents to users, force download with `Content-Disposition: attachment` header, not open in browser
- If possible, serve from a separate domain (XSS isolation)

---

## Image Optimisation

### Why It Matters

Unoptimised images multiply page load time. Using a 50 KB optimised version instead of a 5 MB profile photo dramatically improves user experience.

### Supabase Image Transformation

Supabase Storage provides built-in image transformation. Resize, format conversion, and quality adjustments can be made by adding parameters to the URL.

Recommended strategies:
- **Profile photo:** 200×200px, WebP format
- **Thumbnail:** 300×200px, WebP format
- **Full size:** Keep original dimensions but convert format to WebP

### Next.js Image Optimisation

Next.js's `<Image>` component provides automatic image optimisation:
- Lazy loading (load only when in view)
- Responsive srcset (appropriate resolution for screen size)
- WebP/AVIF format conversion
- Blur placeholder

Add Storage URLs to `remotePatterns` in `next.config.js` — otherwise Next.js won't optimise external domain images.

---

## Plan-Based Storage Limits

Define different storage limits per plan:
- **Free:** 100 MB
- **Starter:** 1 GB
- **Pro:** 10 GB

Check the user's total storage usage before every upload. Reject the upload and suggest a plan upgrade when the limit is exceeded.

Maintain total usage as a counter in the database — update it on every upload and deletion. Calculating total size from the Storage API each time is slow.

---

## Gotchas

- **Public bucket URLs are guessable.** If the file name is known, anyone can access it in a public bucket. Don't put sensitive files in a public bucket.
- **A deleted file's URL may remain in cache.** Access to a deleted file may be possible for the duration of the CDN cache. Use signed URLs for sensitive files.
- **File name collisions.** If a file with the same name is uploaded, it will be overwritten. Generate a unique name with UUID.
- **Storage costs accumulate.** Files belonging to deleted accounts still take up space. Clean up associated files in the account deletion flow.
- **CORS error.** If doing client-side uploads, make sure CORS settings in Supabase Storage are correct.
- **Mobile upload sizes.** Photos uploaded from mobile devices can be at original resolution (10 MB+). Do client-side resize or clearly show the size limit to the user.
- **Include in backups.** Files are stored separately from the database. A database backup does not cover files — plan your storage backup strategy separately.
