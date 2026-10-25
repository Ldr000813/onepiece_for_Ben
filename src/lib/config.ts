const env = import.meta.env

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
}

export const cloudinary = {
  cloudName: env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined,
  uploadPreset: env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined,
}

export const ownerEmail = ((env.VITE_OWNER_EMAIL as string | undefined) || '').trim().toLowerCase()

export const hasFirebase = !!(firebaseConfig.apiKey && firebaseConfig.projectId)
export const hasCloudinary = !!(cloudinary.cloudName && cloudinary.uploadPreset)
