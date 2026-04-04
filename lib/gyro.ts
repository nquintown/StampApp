/**
 * Pre-request DeviceOrientation permission while inside a user gesture.
 * Call this in any click/tap handler that navigates to the stamp detail page.
 * On iOS 13+, permission must originate from a user gesture — the navigation
 * tap is that gesture. After the first grant, subsequent calls resolve
 * immediately so the stamp page can start the gyro without waiting.
 * No-op on Android / desktop where no permission is required.
 */
export async function preGrantGyroPermission(): Promise<void> {
  if (
    typeof window === 'undefined' ||
    typeof DeviceOrientationEvent === 'undefined' ||
    typeof (DeviceOrientationEvent as any).requestPermission !== 'function'
  ) return
  try {
    await (DeviceOrientationEvent as any).requestPermission()
  } catch {}
}
